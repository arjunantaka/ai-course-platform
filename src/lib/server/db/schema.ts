import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const COURSE_STATUSES = [
	'generating_outline',
	'generating_content',
	'failed',
	'draft',
	'published',
	'archived'
] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export type QuizQuestion = {
	question: string;
	options: [string, string, string, string];
	answer_index: number;
	explanation: string;
};

export const courses = sqliteTable('courses', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	level: text('level').$type<CourseLevel>().notNull(),
	language: text('language').notNull().default('id'),
	/** JSON array string, mis. '["javascript","web"]' */
	tags: text('tags').notNull().default('[]'),
	status: text('status').$type<CourseStatus>().notNull(),
	error: text('error'),
	totalLessons: integer('total_lessons').notNull().default(0),
	doneLessons: integer('done_lessons').notNull().default(0),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull(),
	/** JSON array of ReviewNote; diisi pipeline review AI, null bila belum review */
	reviewNotes: text('review_notes'),
	publishedAt: integer('published_at')
});

export const modules = sqliteTable(
	'modules',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		courseId: text('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		orderIndex: integer('order_index').notNull(),
		title: text('title').notNull(),
		summary: text('summary').notNull()
	},
	(t) => [uniqueIndex('modules_course_order_uq').on(t.courseId, t.orderIndex)]
);

export const lessons = sqliteTable(
	'lessons',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		moduleId: text('module_id')
			.notNull()
			.references(() => modules.id, { onDelete: 'cascade' }),
		orderIndex: integer('order_index').notNull(),
		title: text('title').notNull(),
		summary: text('summary').notNull(),
		contentMd: text('content_md').notNull().default(''),
		readingMinutes: integer('reading_minutes').notNull().default(1)
	},
	(t) => [uniqueIndex('lessons_module_order_uq').on(t.moduleId, t.orderIndex)]
);

export const quizzes = sqliteTable('quizzes', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	moduleId: text('module_id')
		.notNull()
		.unique()
		.references(() => modules.id, { onDelete: 'cascade' }),
	/** JSON array of QuizQuestion */
	questions: text('questions').notNull()
});

export type Course = typeof courses.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;

export type ReviewNote = { point: string; reason: string };
