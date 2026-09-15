CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`level` text NOT NULL,
	`language` text DEFAULT 'id' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`total_lessons` integer DEFAULT 0 NOT NULL,
	`done_lessons` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_unique` ON `courses` (`slug`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`content_md` text DEFAULT '' NOT NULL,
	`reading_minutes` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_module_order_uq` ON `lessons` (`module_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modules_course_order_uq` ON `modules` (`course_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`questions` text NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quizzes_module_id_unique` ON `quizzes` (`module_id`);