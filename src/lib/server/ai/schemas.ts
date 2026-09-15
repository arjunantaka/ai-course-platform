import { z } from 'zod';
import { COURSE_LEVELS } from '$lib/server/db/schema';

/** Bentuk dasar outline; divalidasi penuh oleh OutlineBaseSchema (cap 8 modul / 8 lesson). */
export const OutlineBaseSchema = z.object({
	title: z.string().min(3).max(120),
	description: z.string().min(10).max(600),
	level: z.enum(COURSE_LEVELS),
	tags: z.array(z.string().min(1)).min(3).max(6),
	modules: z
		.array(
			z.object({
				title: z.string().min(2).max(120),
				summary: z.string().min(5).max(400),
				lessons: z
					.array(
						z.object({
							title: z.string().min(2).max(120),
							summary: z.string().min(5).max(400)
						})
					)
					.min(1)
					.max(8)
			})
		)
		.min(1)
		.max(8)
});

export const ReviewedOutlineSchema = OutlineBaseSchema.extend({
	dropped: z
		.array(z.object({ point: z.string().min(1), reason: z.string().min(1) }))
		.max(30)
});

export const QuizSchema = z.object({
	questions: z
		.array(
			z.object({
				question: z.string().min(5),
				options: z.array(z.string().min(1)).length(4),
				answer_index: z.number().int().min(0).max(3),
				explanation: z.string().min(5)
			})
		)
		.length(5)
});
