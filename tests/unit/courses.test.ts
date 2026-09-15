import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { resetDatabase } from './helpers/db';

const SAFE_MARKDOWN = [
	'## Lesson',
	'Intro.',
	'### Konsep Dasar',
	'isi',
	'### Cara Kerja',
	'isi',
	'### Alat dan Framework',
	'isi',
	'### Contoh Implementasi',
	'isi',
	'### Studi Kasus Nyata',
	'isi',
	'### Rangkuman',
	'isi',
	'### Sumber',
	'- [Dokumentasi](https://example.com)'
].join('\n');

const quizJson = JSON.stringify([
	{
		question: 'Apa itu test?',
		options: ['a', 'b', 'c', 'd'],
		answer_index: 0,
		explanation: 'karena'
	}
]);

type CourseModule = typeof import('../../src/lib/server/courses');

let courses: CourseModule;
let database: typeof import('../../src/lib/server/db').db;
let schema: typeof import('../../src/lib/server/db/schema');

beforeEach(async () => {
	resetDatabase();
	// mock lintas-modul: server/db diarahkan ke DB sementara. generate.ts TIDAK
	// di-mock agar _testable.validateLessonMarkdown di markdown.test.ts tetap asli;
	// test di sini tidak memanggil createCourse/startGeneration.
	const testDb = await import('./helpers/db');
	mock.module('$lib/server/db', () => ({ db: testDb.db }));
	courses = await import('../../src/lib/server/courses');
	database = (await import('../../src/lib/server/db')).db;
	schema = await import('../../src/lib/server/db/schema');
});

afterEach(() => resetDatabase());

async function seedCourse(id: string, slug: string, tags: string): Promise<void> {
	const now = Date.now();
	await database.insert(schema.courses).values({
		id,
		slug,
		title: 'Kursus Uji',
		description: 'deskripsi',
		level: 'beginner',
		language: 'id',
		tags,
		status: 'draft',
		totalLessons: 1,
		doneLessons: 0,
		createdAt: now,
		updatedAt: now
	});
}

async function seedModuleQuiz(
	courseId: string,
	moduleId: string,
	questions: string
): Promise<void> {
	await database.insert(schema.modules).values({
		id: moduleId,
		courseId,
		orderIndex: 0,
		title: 'Modul',
		summary: 'ringkasan modul'
	});
	await database.insert(schema.lessons).values({
		id: crypto.randomUUID(),
		moduleId,
		orderIndex: 0,
		title: 'Lesson',
		summary: 'ringkasan',
		contentMd: SAFE_MARKDOWN,
		readingMinutes: 1
	});
	await database.insert(schema.quizzes).values({
		id: crypto.randomUUID(),
		moduleId,
		questions
	});
}

async function seedModuleLesson(courseId: string, moduleId: string, lessonId: string): Promise<void> {
	await database.insert(schema.modules).values({
		id: moduleId,
		courseId,
		orderIndex: 0,
		title: 'Modul',
		summary: 'ringkasan modul'
	});
	await database.insert(schema.lessons).values({
		id: lessonId,
		moduleId,
		orderIndex: 0,
		title: 'Lesson Awal',
		summary: 'ringkasan awal',
		contentMd: SAFE_MARKDOWN,
		readingMinutes: 1
	});
}

describe('listCourseCards search', () => {
	test('mencocokkan pencarian di dalam JSON tag (scr → javascript)', async () => {
		await seedCourse('c1', 'kursus-satu', '["javascript","web"]');
		await seedCourse('c2', 'kursus-dua', '["python"]');

		const found = await courses.listCourseCards({ q: 'scr', order: 'created' });
		expect(found.map((card) => card.id)).toEqual(['c1']);
	});

	test('mengembalikan kosong bila tidak ada yang cocok', async () => {
		await seedCourse('c1', 'kursus-satu', '["javascript"]');
		const found = await courses.listCourseCards({ q: 'rust' });
		expect(found).toEqual([]);
	});
});

describe('getModuleQuiz', () => {
	test('mengembalikan soal saat kolom questions valid', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedModuleQuiz('c1', 'm1', quizJson);

		const quiz = await courses.getModuleQuiz('c1', 'm1');
		expect(quiz?.questions).toHaveLength(1);
		expect(quiz?.questions[0]!.question).toBe('Apa itu test?');
	});

	test('mengembalikan null saat kolom questions rusak, bukan melempar', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedModuleQuiz('c1', 'm1', '{bukan json');

		expect(await courses.getModuleQuiz('c1', 'm1')).toBeNull();
	});

	test('mengembalikan null saat modul bukan milik kursus', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedCourse('c2', 'kursus-dua', '[]');
		await seedModuleQuiz('c2', 'm2', quizJson);

		expect(await courses.getModuleQuiz('c1', 'm2')).toBeNull();
	});
});

describe('getCourseTree', () => {
	test('menandai hasQuiz tetap true walau questions rusak, tanpa soal', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedModuleQuiz('c1', 'm1', '{rusak');

		const tree = await courses.getCourseTree('c1', { includeQuizQuestions: true });
		const mod = tree!.modules[0]!;
		expect(mod.hasQuiz).toBe(true);
		expect(mod.quizQuestions).toBeUndefined();
	});

	test('mengisi quizQuestions saat kolom valid', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedModuleQuiz('c1', 'm1', quizJson);

		const tree = await courses.getCourseTree('c1', { includeQuizQuestions: true });
		expect(tree!.modules[0]!.quizQuestions).toHaveLength(1);
	});
});

describe('publishCourse / unpublishCourse', () => {
	test('publish dari draft → published + publishedAt terisi', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');

		expect(await courses.publishCourse('c1')).toBe(true);

		const [row] = await database
			.select({ status: schema.courses.status, publishedAt: schema.courses.publishedAt })
			.from(schema.courses);
		expect(row?.status).toBe('published');
		expect(row?.publishedAt).not.toBeNull();
	});

	test('publish dari published tetap true (idempoten)', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await courses.publishCourse('c1');

		expect(await courses.publishCourse('c1')).toBe(true);
	});

	test('publish ditolak saat masih generate', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await database
			.update(schema.courses)
			.set({ status: 'generating_content' })
			.where(eq(schema.courses.id, 'c1'));

		expect(await courses.publishCourse('c1')).toBe(false);
	});

	test('unpublish dari published → archived + publishedAt dikosongkan', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await courses.publishCourse('c1');

		expect(await courses.unpublishCourse('c1')).toBe(true);

		const [row] = await database.select().from(schema.courses);
		expect(row?.status).toBe('archived');
		expect(row?.publishedAt).toBeNull();
	});

	test('unpublish dari draft ditolak', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');

		expect(await courses.unpublishCourse('c1')).toBe(false);
	});
});

describe('deleteCourse', () => {
	test('menghapus kursus beserta modul/lesson/kuis via cascade', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedModuleQuiz('c1', 'm1', quizJson);

		await courses.deleteCourse('c1');

		expect(await database.select().from(schema.courses)).toHaveLength(0);
		expect(await database.select().from(schema.modules)).toHaveLength(0);
		expect(await database.select().from(schema.lessons)).toHaveLength(0);
		expect(await database.select().from(schema.quizzes)).toHaveLength(0);
	});
});

describe('getGenerationStatus', () => {
	test('mengembalikan null untuk kursus yang tidak ada', async () => {
		expect(await courses.getGenerationStatus('tidak-ada')).toBeNull();
	});

	test('mengembalikan status + counter progress', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');

		expect(await courses.getGenerationStatus('c1')).toEqual({
			status: 'draft',
			totalLessons: 1,
			doneLessons: 0,
			error: null
		});
	});
});

describe('saveLessonContent', () => {
	test('menghitung readingMinutes dari jumlah kata; title/summary tak disentuh', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedModuleLesson('c1', 'm1', 'l1');
		const content = Array.from({ length: 250 }, (_, i) => `kata${i}`).join(' ');

		const saved = await courses.saveLessonContent('l1', { contentMd: content });

		expect(saved).toEqual({ readingMinutes: 2 });
		const [row] = await database.select().from(schema.lessons);
		expect(row?.title).toBe('Lesson Awal');
		expect(row?.summary).toBe('ringkasan awal');
		expect(row?.contentMd).toBe(content);
	});

	test('menyimpan title/summary bila dikirim', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedModuleLesson('c1', 'm1', 'l1');

		await courses.saveLessonContent('l1', {
			title: 'Judul Baru',
			summary: 'ringkasan baru',
			contentMd: 'materi'
		});

		const [row] = await database.select().from(schema.lessons);
		expect(row?.title).toBe('Judul Baru');
		expect(row?.summary).toBe('ringkasan baru');
	});

	test('mengembalikan null bila lesson tidak ada', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');

		expect(await courses.saveLessonContent('tidak-ada', { contentMd: 'materi' })).toBeNull();
	});
});

describe('getPublishedCourseBySlug (decode tags di boundary)', () => {
	test('mengembalikan tags sebagai array string', async () => {
		await seedCourse('c1', 'kursus-satu', '["devops","ci"]');
		await courses.publishCourse('c1');

		const course = await courses.getPublishedCourseBySlug('kursus-satu');

		expect(course?.tags).toEqual(['devops', 'ci']);
	});

	test('tags rusak → array kosong, bukan error', async () => {
		await seedCourse('c1', 'kursus-satu', '{rusak');
		await courses.publishCourse('c1');

		const course = await courses.getPublishedCourseBySlug('kursus-satu');

		expect(course?.tags).toEqual([]);
	});

	test('null bila kursus belum published', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');

		expect(await courses.getPublishedCourseBySlug('kursus-satu')).toBeNull();
	});
});

describe('getCourseTree (decode reviewNotes di boundary)', () => {
	test('mengembalikan reviewNotes sebagai ReviewNote[]', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await database
			.update(schema.courses)
			.set({ reviewNotes: '[{"point":"p","reason":"r"}]' })
			.where(eq(schema.courses.id, 'c1'));

		const tree = await courses.getCourseTree('c1');

		expect(tree?.course.reviewNotes).toEqual([{ point: 'p', reason: 'r' }]);
	});

	test('reviewNotes null/rusak → array kosong', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await database
			.update(schema.courses)
			.set({ reviewNotes: '{rusak' })
			.where(eq(schema.courses.id, 'c1'));

		const tree = await courses.getCourseTree('c1');

		expect(tree?.course.reviewNotes).toEqual([]);
	});
});

describe('recoverInterruptedGenerations', () => {
	test('kursus terjebak generate → failed dengan pesan restart; kursus lain tak tersentuh', async () => {
		await seedCourse('c1', 'kursus-satu', '[]');
		await seedCourse('c2', 'kursus-dua', '[]');
		await database
			.update(schema.courses)
			.set({ status: 'generating_content' })
			.where(eq(schema.courses.id, 'c1'));
		await courses.publishCourse('c2');

		await courses.recoverInterruptedGenerations();

		const [recovered] = await database
			.select()
			.from(schema.courses)
			.where(eq(schema.courses.id, 'c1'));
		expect(recovered?.status).toBe('failed');
		expect(recovered?.error).toBe('Server restart saat generate');
		const [untouched] = await database
			.select()
			.from(schema.courses)
			.where(eq(schema.courses.id, 'c2'));
		expect(untouched?.status).toBe('published');
	});
});