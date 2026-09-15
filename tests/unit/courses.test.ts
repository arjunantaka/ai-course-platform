import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
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