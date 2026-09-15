import { asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { courses, lessons, modules, quizzes, type CourseLevel } from '$lib/server/db/schema';
import { slugify } from '$lib/utils';
import { chatJson, chatText } from './client';
import { OutlineBaseSchema, ReviewedOutlineSchema, QuizSchema } from './schemas';

export type CreateCourseInput = {
	topic: string;
	level: CourseLevel;
	language: string;
	points: string[];
};

/**
 * Pipeline generate 4 tahap (kategorisasi → review AI → lesson sequential → kuis per modul),
 * fire-and-forget: pemanggil TIDAK meng-await fungsi ini. Setiap tahap menulis status/counter
 * ke DB sehingga proses toleran dipantau (polling) dan restart (→ failed).
 */

const ANTI_SLOP_RULES = [
	'ATURAN GAYA ANTI-SLOP (wajib untuk semua teks yang kamu tulis):',
	'- Dilarang kata pemanis: unlock, elevate, empower, delve, game-changer, next-level, seamless, cutting-edge, revolusioner, "membuka kekuatan", "di era digital yang serba cepat", "dalam dunia yang terus berkembang", "perjalanan" sebagai metafora.',
	'- Dilarang pembuka meta: "Mari kita selami", "Pada materi ini kita akan membahas", "Tanpa basa-basi lagi".',
	'- Dilarang penutup generik dan sapaan chatbot: "Masa depan cerah menanti", "Semoga membantu", "Silakan bertanya jika ada pertanyaan".',
	'- Dilarang mengarang fakta: tidak ada statistik, tanggal, nama orang, studi, atau kutipan yang tidak benar-benar ada.',
	'- Dilarang atribusi samar: "para ahli mengatakan", "banyak yang percaya". Sebut sumber nyata atau hapus klaim.',
	'- Dilarang em dash (—). Gunakan titik, koma, atau titik dua.',
	'- Bold hanya untuk istilah yang benar-benar kunci, maksimal satu per paragraf. Dilarang pola bullet "- **Label:** isi".',
	'- Kalimat aktif dengan aktor jelas; hindari pasif tanpa pelaku.',
	'- Variasikan panjang kalimat; jangan paksa pola rangkap tiga.',
	'- Spesifik dan konkret: nama alat nyata, contoh nyata, bukan klaim umum.'
].join('\n');

/** Heading wajib materi lesson per bahasa; dipakai prompt dan validasi struktur. */
const LESSON_SECTION_SPECS: Record<string, Array<[name: string, description: string]>> = {
	id: [
		['Konsep Dasar', 'definisi dan fondasi konsep'],
		['Cara Kerja', 'mekanisme atau alurnya langkah demi langkah'],
		['Alat dan Framework', 'alat nyata beserta perannya; untuk topik konseptual, sebut praktik atau alat pendukung yang relevan'],
		['Contoh Implementasi', 'contoh konkret; blok kode dengan fence bila topik teknis; langkah kerja terperinci bila non-kode'],
		['Studi Kasus Nyata', 'satu skenario dunia nyata dengan konteks, masalah, penerapan, hasil; tanpa angka rekaan'],
		['Rangkuman', '3-5 poin kunci'],
		['Sumber', '2-4 rujukan, format "- [Judul sumber](url)". Hanya sumber kanonik yang benar-benar ada: dokumentasi resmi, buku yang dikenal, standar/RFC. Dilarang URL rekaan']
	],
	en: [
		['Core Concepts', 'definitions and the conceptual foundation'],
		['How It Works', 'the mechanism or flow, step by step'],
		['Tools and Frameworks', 'real tools and their roles; for conceptual topics, mention relevant practices or supporting tools'],
		['Implementation Example', 'a concrete example; fenced code blocks for technical topics, detailed working steps for non-code topics'],
		['Real-World Case', 'one real-world scenario with context, problem, application, and outcome; no invented numbers'],
		['Summary', '3-5 key points'],
		['Sources', '2-4 references, format "- [Source title](url)". Only canonical sources that truly exist: official docs, well-known books, standards/RFCs. Never invent URLs']
	]
};

const LESSON_SECTIONS: Record<string, string[]> = {
	id: LESSON_SECTION_SPECS.id.map(([name]) => name),
	en: LESSON_SECTION_SPECS.en.map(([name]) => name)
};

function validateLessonMarkdown(content: string, language: string): string[] {
	const issues: string[] = [];
	if (!content.trimStart().startsWith('## ')) issues.push('konten harus diawali "## " berisi judul');
	const sections = LESSON_SECTIONS[language] ?? (language.startsWith('en') ? LESSON_SECTIONS.en : undefined);
	if (!sections) {
		const count = (content.match(/^### /gm) ?? []).length;
		if (count < 6) issues.push(`minimal 6 sub-heading "### ", ditemukan ${count}`);
		return issues;
	}
	for (const name of sections) {
		const re = new RegExp(`^### ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'mi');
		if (!re.test(content)) issues.push(`section wajib "### ${name}" tidak ditemukan`);
	}
	return issues;
}

export function startGeneration(courseId: string, input: CreateCourseInput): void {
	runPipeline(courseId, input).catch((e) => {
		console.error(`[generate] pipeline course ${courseId} crash:`, e);
	});
}

async function runPipeline(courseId: string, input: CreateCourseInput): Promise<void> {
	try {
		const outline = await buildOutline(courseId, input);
		const outlineContext = `${outline.title}. ${outline.description}`;
		await generateAllLessons(courseId, outlineContext, input.language);
		await generateAllQuizzes(courseId, outlineContext, input.language);
		await db
			.update(courses)
			.set({ status: 'draft', error: null, updatedAt: Date.now() })
			.where(eq(courses.id, courseId));
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		await db
			.update(courses)
			.set({ status: 'failed', error: message.slice(0, 500), updatedAt: Date.now() })
			.where(eq(courses.id, courseId));
	}
}

// Tahap 1a: kategorisasi poin pembelajaran menjadi draft outline

function categorizeSystemPrompt(): string {
	return [
		'Kamu adalah desainer kurikulum kursus online. Tugasmu mengelompokkan poin pembelajaran dari admin menjadi outline kursus yang fokus.',
		'Balas HANYA JSON valid dengan bentuk persis:',
		'{"title": string, "description": string 1-2 kalimat, "level": "beginner"|"intermediate"|"advanced", "tags": array 3-6 string, "modules": [{"title": string, "summary": string 1 kalimat, "lessons": [{"title": string, "summary": string 1 kalimat}]}]}',
		'Aturan:',
		'- Setiap modul adalah SATU kategori skill yang berdiri sendiri; gabungkan hanya poin yang memang satu rumpun.',
		'- Tiap lesson berasal dari satu poin atau beberapa poin yang merupakan faset dari satu skill yang sama; summary lesson merestate isi poin aslinya.',
		'- Setiap poin admin harus muncul tepat satu kali di salah satu lesson. Jangan menambah topik baru di luar poin admin.',
		'- Urutkan modul dari fondasi ke lanjutan.',
		'- Maksimal 8 modul, maksimal 8 lesson per modul.',
		ANTI_SLOP_RULES,
		'Jangan tulis apa pun di luar JSON.'
	].join('\n');
}

function categorizeUserPrompt(input: CreateCourseInput): string {
	return [
		'Kategorikan poin pembelajaran menjadi outline kursus.',
		`Topik: ${input.topic}`,
		`Level: ${input.level}`,
		`Bahasa konten: ${input.language}`,
		'Poin pembelajaran:',
		...input.points.map((point) => `- ${point}`)
	].join('\n');
}

// Tahap 1b: review AI memangkas draft outline

function reviewSystemPrompt(): string {
	return [
		'Kamu adalah reviewer kurikulum yang tegas. Kamu menerima draft outline kursus beserta poin pembelajaran asli dari admin.',
		'Tugasmu: review ulang draft. Hapus lesson yang di luar topik, redundan, atau terlalu sempit untuk berdiri sendiri; gabungkan lesson yang tumpang tindih; perbaiki judul yang kabur; pastikan urutan fondasi ke lanjutan.',
		'Balas HANYA JSON valid: outline final dengan bentuk sama seperti draft, ditambah satu field "dropped": [{"point": string, "reason": string}].',
		'Aturan:',
		'- "dropped" berisi SETIAP poin asli admin yang tidak lagi tercakup di outline final, dengan alasan singkat berbahasa Indonesia.',
		'- Poin yang digabung ke lesson lain TIDAK masuk dropped.',
		'- Jangan menambah topik baru di luar poin admin.',
		ANTI_SLOP_RULES,
		'Jangan tulis apa pun di luar JSON.'
	].join('\n');
}

function reviewUserPrompt(input: CreateCourseInput, draft: OutlineBase): string {
	return [
		'Review draft outline kursus berikut.',
		`Topik: ${input.topic}`,
		`Level: ${input.level}`,
		'Poin pembelajaran asli:',
		...input.points.map((point) => `- ${point}`),
		'Draft outline (JSON):',
		JSON.stringify(draft)
	].join('\n');
}

type OutlineBase = {
	title: string;
	description: string;
	level: 'beginner' | 'intermediate' | 'advanced';
	tags: string[];
	modules: Array<{
		title: string;
		summary: string;
		lessons: Array<{ title: string; summary: string }>;
	}>;
};

async function buildOutline(courseId: string, input: CreateCourseInput) {
	await db
		.update(courses)
		.set({ status: 'generating_outline', updatedAt: Date.now() })
		.where(eq(courses.id, courseId));

	const draft = await chatJson(
		categorizeSystemPrompt(),
		categorizeUserPrompt(input),
		OutlineBaseSchema,
		'planner'
	);
	const reviewed = await chatJson(
		reviewSystemPrompt(),
		reviewUserPrompt(input, draft),
		ReviewedOutlineSchema,
		'planner'
	);
	const totalLessons = reviewed.modules.reduce((n, mod) => n + mod.lessons.length, 0);
	const now = Date.now();

	await db.transaction(async (tx) => {
		await tx
			.update(courses)
			.set({
				title: reviewed.title,
				description: reviewed.description,
				level: reviewed.level,
				language: input.language,
				tags: JSON.stringify(reviewed.tags),
				slug: slugify(reviewed.title),
				totalLessons,
				reviewNotes: JSON.stringify(reviewed.dropped),
				status: 'generating_content',
				updatedAt: now
			})
			.where(eq(courses.id, courseId));

		for (const [mi, mod] of reviewed.modules.entries()) {
			const [modRow] = await tx
				.insert(modules)
				.values({
					id: crypto.randomUUID(),
					courseId,
					orderIndex: mi,
					title: mod.title,
					summary: mod.summary
				})
				.returning({ id: modules.id });
			await tx.insert(lessons).values(
				mod.lessons.map((lesson, li) => ({
					id: crypto.randomUUID(),
					moduleId: modRow!.id,
					orderIndex: li,
					title: lesson.title,
					summary: lesson.summary,
					contentMd: '',
					readingMinutes: 1
				}))
			);
		}
	});

	return reviewed;
}

// Tahap 2: materi per lesson, satu panggilan per lesson secara sequential

function lessonSystemPrompt(language: string): string {
	const specs = LESSON_SECTION_SPECS[language.startsWith('en') ? 'en' : 'id'];
	return [
		'Kamu adalah penulis materi kursus teknis yang jelas dan terstruktur.',
		`Tulis dalam bahasa ${language}.`,
		'Format Markdown persis seperti ini:',
		'1. Baris pertama: "## " diikuti judul lesson.',
		'2. Intro 2-4 kalimat tanpa heading: apa yang dipelajari dan mengapa penting.',
		'3. Tujuh section wajib, urut, masing-masing heading "### ":',
		...specs.map(([name, description]) => `   - "### ${name}": ${description}.`),
		'Panjang 700-1200 kata. Daftar bernomor/bullet rapi, indentasi konsisten. Jangan tambahkan judul kursus atau metadata apa pun.',
		ANTI_SLOP_RULES
	].join('\n');
}

function lessonUserPrompt(
	outlineContext: string,
	moduleTitle: string,
	lessonTitle: string,
	lessonSummary: string,
	language: string
): string {
	return [
		'Tulis materi lesson kursus.',
		`Kursus: ${outlineContext}`,
		`Modul: ${moduleTitle}`,
		`Lesson: ${lessonTitle}`,
		`Ringkasan lesson: ${lessonSummary}`,
		`Bahasa konten: ${language}`,
		'Panjang: 700-1200 kata.'
	].join('\n');
}

async function generateAllLessons(courseId: string, outlineContext: string, language: string): Promise<void> {
	const rows = await db
		.select({
			lessonId: lessons.id,
			lessonTitle: lessons.title,
			lessonSummary: lessons.summary,
			moduleTitle: modules.title
		})
		.from(lessons)
		.innerJoin(modules, eq(lessons.moduleId, modules.id))
		.where(eq(modules.courseId, courseId))
		.orderBy(asc(modules.orderIndex), asc(lessons.orderIndex));

	const system = lessonSystemPrompt(language);
	// sequential: satu lesson per panggilan agar model fokus dan ramah rate limit
	for (const row of rows) {
		await writeLesson(
			courseId,
			outlineContext,
			row.moduleTitle,
			row.lessonId,
			row.lessonTitle,
			row.lessonSummary,
			language,
			system
		);
	}
}

async function writeLesson(
	courseId: string,
	outlineContext: string,
	moduleTitle: string,
	lessonId: string,
	lessonTitle: string,
	lessonSummary: string,
	language: string,
	system: string
): Promise<void> {
	const user = lessonUserPrompt(outlineContext, moduleTitle, lessonTitle, lessonSummary, language);
	let content = await chatText(system, user);
	const issues = validateLessonMarkdown(content, language);
	if (issues.length > 0) {
		content = await chatText(
			system,
			`${user}\n\nDraft sebelumnya bermasalah: ${issues.join('; ')}. Tulis ulang lengkap dengan struktur yang benar.`
		);
		const remaining = validateLessonMarkdown(content, language);
		if (remaining.length > 0) {
			console.warn(`[generate] lesson ${lessonId} masih melanggar struktur: ${remaining.join('; ')}`);
		}
	}
	const words = content.split(/\s+/).filter(Boolean).length;
	const readingMinutes = Math.max(1, Math.ceil(words / 200));
	await db.update(lessons).set({ contentMd: content, readingMinutes }).where(eq(lessons.id, lessonId));
	await db
		.update(courses)
		.set({ doneLessons: sql`MIN(${courses.doneLessons} + 1, ${courses.totalLessons})`, updatedAt: Date.now() })
		.where(eq(courses.id, courseId));
}

// Tahap 3: kuis per modul, diground ke isi materi lesson

function quizSystemPrompt(language: string): string {
	return [
		'Kamu adalah pembuat soal evaluasi kursus yang bermutu.',
		`Tulis dalam bahasa ${language}.`,
		'Balas HANYA JSON valid dengan bentuk persis:',
		'{"questions": [{"question": string, "options": [string, string, string, string], "answer_index": 0|1|2|3, "explanation": string}]}',
		'Tepat 5 soal, menyinggung materi semua lesson modul, opsi pengecoh masuk akal.',
		'Soal harus menguji materi aktual tiap lesson (lihat ringkasan dan kutipan), bukan menebak dari judul. explanation menyebut konsep yang diuji.',
		ANTI_SLOP_RULES,
		'Jangan tulis apa pun di luar JSON.'
	].join('\n');
}

function quizUserPrompt(
	outlineContext: string,
	moduleTitle: string,
	lessonContexts: Array<{ title: string; summary: string; excerpt: string }>
): string {
	return [
		'Buat kuis pilihan ganda.',
		`Kursus: ${outlineContext}`,
		`Modul: ${moduleTitle}`,
		'Materi lesson dalam modul:',
		...lessonContexts.map((lesson) => `- ${lesson.title}: ${lesson.summary} Kutipan: ${lesson.excerpt}`),
		'Jumlah soal: tepat 5'
	].join('\n');
}

async function generateAllQuizzes(courseId: string, outlineContext: string, language: string): Promise<void> {
	const modRows = await db
		.select()
		.from(modules)
		.where(eq(modules.courseId, courseId))
		.orderBy(asc(modules.orderIndex));

	for (const mod of modRows) {
		const lessonRows = await db
			.select({ title: lessons.title, summary: lessons.summary, contentMd: lessons.contentMd })
			.from(lessons)
			.where(eq(lessons.moduleId, mod.id))
			.orderBy(asc(lessons.orderIndex));
		const quiz = await chatJson(
			quizSystemPrompt(language),
			quizUserPrompt(
				outlineContext,
				mod.title,
				lessonRows.map((row) => ({
					title: row.title,
					summary: row.summary,
					excerpt: row.contentMd.replace(/\s+/g, ' ').trim().slice(0, 400)
				}))
			),
			QuizSchema,
			'text'
		);
		await db.insert(quizzes).values({
			id: crypto.randomUUID(),
			moduleId: mod.id,
			questions: JSON.stringify(quiz.questions)
		});
	}
}

/** Permukaan internal untuk unit test; tidak dipakai kode aplikasi. */
export const _testable = { validateLessonMarkdown };
