import { and, asc, countDistinct, desc, eq, like, or, sql, sum } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import {
	courses,
	lessons,
	modules,
	quizzes,
	COURSE_LEVELS,
	type Course,
	type CourseLevel,
	type CourseStatus,
	type QuizQuestion
} from '$lib/server/db/schema';
import { slugify } from '$lib/utils';
import { startGeneration } from './ai/generate';

export const CreateCourseInputSchema = z.object({
	topic: z
		.string()
		.trim()
		.min(8, 'Topik minimal 8 karakter')
		.max(300, 'Topik maksimal 300 karakter'),
	level: z.enum(COURSE_LEVELS, { error: 'Level harus beginner, intermediate, atau advanced' }),
	language: z.string().trim().min(2, 'Bahasa minimal 2 karakter').max(20).default('id'),
	points: z.preprocess(
		(v) => v ?? [],
		z
			.array(z.string().trim().min(3, 'Setiap poin minimal 3 karakter').max(300, 'Setiap poin maksimal 300 karakter'))
			.min(5, 'Minimal 5 poin pembelajaran')
			.max(30, 'Maksimal 30 poin pembelajaran')
	),
});
export type CreateCourseData = z.output<typeof CreateCourseInputSchema>;

// Query bersama (publik + admin)

export type CourseCard = {
	id: string;
	slug: string;
	title: string;
	description: string;
	level: CourseLevel;
	status: CourseStatus;
	moduleCount: number;
	totalLessons: number;
	doneLessons: number;
	totalMinutes: number;
	createdAt: number;
	publishedAt: number | null;
};

export async function listCourseCards(
	options: { q?: string; publishedOnly?: boolean; limit?: number; order?: 'created' | 'published' } = {}
): Promise<CourseCard[]> {
	const conditions = [];
	if (options.publishedOnly) conditions.push(eq(courses.status, 'published'));
	if (options.q) {
		const needle = `%${options.q.toLowerCase()}%`;
		conditions.push(
			or(
				like(sql`lower(${courses.title})`, needle),
				like(sql`lower(${courses.description})`, needle),
				like(sql`lower(${courses.tags})`, needle)
			)
		);
	}

	const rows = await db
		.select({
			id: courses.id,
			slug: courses.slug,
			title: courses.title,
			description: courses.description,
			level: courses.level,
			status: courses.status,
			totalLessons: courses.totalLessons,
			doneLessons: courses.doneLessons,
			createdAt: courses.createdAt,
			publishedAt: courses.publishedAt
		})
		.from(courses)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(
			options.order === 'created' ? desc(courses.createdAt) : desc(courses.publishedAt),
			desc(courses.createdAt)
		)
		.limit(options.limit ?? 100);

	if (rows.length === 0) return [];

	// jumlah modul + total menit ditarik lewat agregasi terpisah: subquery berkorelasi
	// di select membuat drizzle merender nama kolom tanpa qualifier (kolom ambigu di SQLite)
	const statRows = await db
		.select({
			courseId: modules.courseId,
			moduleCount: countDistinct(modules.id),
			totalMinutes: sum(lessons.readingMinutes)
		})
		.from(modules)
		.leftJoin(lessons, eq(lessons.moduleId, modules.id))
		.groupBy(modules.courseId);
	const statsByCourse = new Map(statRows.map((row) => [row.courseId, row]));

	return rows.map((row) => {
		const stats = statsByCourse.get(row.id);
		return {
			...row,
			moduleCount: stats?.moduleCount ?? 0,
			totalMinutes: Number(stats?.totalMinutes ?? 0)
		};
	});
}

export async function getPublishedCourseBySlug(slug: string): Promise<Course | null> {
	const [row] = await db
		.select()
		.from(courses)
		.where(and(eq(courses.slug, slug), eq(courses.status, 'published')))
		.limit(1);
	return row ?? null;
}

export type LessonNode = {
	id: string;
	title: string;
	summary: string;
	orderIndex: number;
	readingMinutes: number;
	hasContent: boolean;
	contentMd?: string;
};

export type ModuleNode = {
	id: string;
	title: string;
	summary: string;
	orderIndex: number;
	hasQuiz: boolean;
	quizQuestions?: QuizQuestion[];
	lessons: LessonNode[];
};

export type CourseTree = { course: Course; modules: ModuleNode[] };

export async function getCourseTree(
	courseId: string,
	options: { includeContent?: boolean; includeQuizQuestions?: boolean } = {}
): Promise<CourseTree | null> {
	const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
	if (!course) return null;

	const modRows = await db
		.select()
		.from(modules)
		.where(eq(modules.courseId, courseId))
		.orderBy(asc(modules.orderIndex));

	const lessonRows = await db
		.select({
			id: lessons.id,
			moduleId: lessons.moduleId,
			orderIndex: lessons.orderIndex,
			title: lessons.title,
			summary: lessons.summary,
			contentMd: lessons.contentMd,
			readingMinutes: lessons.readingMinutes
		})
		.from(lessons)
		.innerJoin(modules, eq(lessons.moduleId, modules.id))
		.where(eq(modules.courseId, courseId))
		.orderBy(asc(modules.orderIndex), asc(lessons.orderIndex));

	const quizRows = await db
		.select({ moduleId: quizzes.moduleId, questions: quizzes.questions })
		.from(quizzes)
		.innerJoin(modules, eq(quizzes.moduleId, modules.id))
		.where(eq(modules.courseId, courseId));
	const quizByModule = new Map(quizRows.map((row) => [row.moduleId, row.questions]));

	return {
		course,
		modules: modRows.map((mod) => {
			const rawQuiz = quizByModule.get(mod.id);
			let quizQuestions: QuizQuestion[] | undefined;
			if (options.includeQuizQuestions && rawQuiz !== undefined) {
				try {
					quizQuestions = JSON.parse(rawQuiz) as QuizQuestion[];
				} catch {
					// kolom questions rusak → tampilkan modul tanpa daftar soal
				}
			}
			return {
				id: mod.id,
				title: mod.title,
				summary: mod.summary,
				orderIndex: mod.orderIndex,
				hasQuiz: rawQuiz !== undefined,
				quizQuestions,
				lessons: lessonRows
					.filter((lesson) => lesson.moduleId === mod.id)
					.map((lesson) => ({
						id: lesson.id,
						title: lesson.title,
						summary: lesson.summary,
						orderIndex: lesson.orderIndex,
						readingMinutes: lesson.readingMinutes,
						hasContent: lesson.contentMd.length > 0,
						contentMd: options.includeContent ? lesson.contentMd : undefined
					}))
			};
		})
	};
}

export type FlatLesson = {
	id: string;
	title: string;
	readingMinutes: number;
	contentMd: string;
	moduleId: string;
	moduleTitle: string;
};

/** Seluruh lesson satu kursus, rata dan terurut (modul, lalu lesson). */
export async function listFlatLessons(courseId: string): Promise<FlatLesson[]> {
	return db
		.select({
			id: lessons.id,
			title: lessons.title,
			readingMinutes: lessons.readingMinutes,
			contentMd: lessons.contentMd,
			moduleId: modules.id,
			moduleTitle: modules.title
		})
		.from(lessons)
		.innerJoin(modules, eq(lessons.moduleId, modules.id))
		.where(eq(modules.courseId, courseId))
		.orderBy(asc(modules.orderIndex), asc(lessons.orderIndex));
}

/** Kuis satu modul milik kursus; null bila modul/kursus tidak cocok atau belum ada kuis. */
export async function getModuleQuiz(
	courseId: string,
	moduleId: string
): Promise<{ id: string; title: string; questions: QuizQuestion[] } | null> {
	const [mod] = await db
		.select({ id: modules.id, title: modules.title })
		.from(modules)
		.where(and(eq(modules.id, moduleId), eq(modules.courseId, courseId)))
		.limit(1);
	if (!mod) return null;
	const [quiz] = await db
		.select({ questions: quizzes.questions })
		.from(quizzes)
		.where(eq(quizzes.moduleId, mod.id))
		.limit(1);
	if (!quiz) return null;
	try {
		return { id: mod.id, title: mod.title, questions: JSON.parse(quiz.questions) as QuizQuestion[] };
	} catch {
		// kolom questions rusak → perlakukan seperti kuis tidak ada
		return null;
	}
}

export async function moduleHasQuiz(moduleId: string): Promise<boolean> {
	const [row] = await db
		.select({ id: quizzes.id })
		.from(quizzes)
		.where(eq(quizzes.moduleId, moduleId))
		.limit(1);
	return row !== undefined;
}

// Create course

/**
 * Insert kursus baru (slug sementara dari topik; slug final di-set pipeline dari
 * judul outline), lalu jalankan pipeline generate tanpa di-await.
 */
export async function createCourse(input: CreateCourseData): Promise<string> {
	const now = Date.now();
	const courseId = crypto.randomUUID();
	await db.insert(courses).values({
		id: courseId,
		slug: slugify(input.topic),
		title: input.topic,
		description: '',
		level: input.level,
		language: input.language,
		tags: '[]',
		status: 'generating_outline',
		createdAt: now,
		updatedAt: now
	});
	startGeneration(courseId, {
		topic: input.topic,
		level: input.level,
		language: input.language,
		points: input.points
	});
	return courseId;
}
