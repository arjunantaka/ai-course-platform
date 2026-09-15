import { browser } from '$app/environment';

type QuizResult = { score: number; total: number; at: number };

type CourseProgress = { lessons: string[]; quizzes: Record<string, QuizResult> };
type ProgressData = Record<string, CourseProgress>;

const STORAGE_KEY = 'krascourse:progress';

function load(): ProgressData {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed: unknown = JSON.parse(raw);
		if (parsed && typeof parsed === 'object') return parsed as ProgressData;
	} catch {
		// data localStorage rusak → mulai dari nol
	}
	return {};
}

/**
 * Satu-satunya sumber kebenaran progress belajar (client-side, localStorage).
 * Tidak ada akun di MVP → progress tidak pernah dikirim ke server.
 */
let initialized = false;

class ProgressStore {
	data = $state<ProgressData>({});

	constructor() {
		if (initialized) throw new Error('ProgressStore: gunakan export const progress');
		initialized = true;
		this.data = load();
	}

	#persist(): void {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
	}

	#course(slug: string): CourseProgress {
		return this.data[slug] ?? { lessons: [], quizzes: {} };
	}

	isLessonDone(slug: string, lessonId: string): boolean {
		return this.#course(slug).lessons.includes(lessonId);
	}

	toggleLesson(slug: string, lessonId: string): void {
		const course = this.#course(slug);
		const lessons = course.lessons.includes(lessonId)
			? course.lessons.filter((id) => id !== lessonId)
			: [...course.lessons, lessonId];
		this.data[slug] = { ...course, lessons };
		this.#persist();
	}

	saveQuiz(slug: string, moduleId: string, score: number, total: number): void {
		const course = this.#course(slug);
		this.data[slug] = {
			...course,
			quizzes: { ...course.quizzes, [moduleId]: { score, total, at: Date.now() } }
		};
		this.#persist();
	}

	quizResult(slug: string, moduleId: string): QuizResult | undefined {
		return this.#course(slug).quizzes[moduleId];
	}

	summary(slug: string, totalLessons: number): { done: number; pct: number } {
		const done = this.#course(slug).lessons.length;
		return {
			done,
			pct: totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0
		};
	}
}

export const progress = new ProgressStore();
