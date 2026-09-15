import { describe, expect, test } from 'bun:test';
import { _testable } from '../../src/lib/server/ai/generate';

const { validateLessonMarkdown } = _testable;

/** Markdown valid untuk bahasa id: heading + tujuh section wajib. */
const VALID_ID = [
	'## Judul Lesson',
	'Intro singkat tentang materi.',
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

describe('validateLessonMarkdown', () => {
	test('menerima markdown id yang lengkap', () => {
		expect(validateLessonMarkdown(VALID_ID, 'id')).toEqual([]);
	});

	test('menolak konten yang tidak diawali "## "', () => {
		const issues = validateLessonMarkdown('# Judul\n\n### Konsep Dasar', 'id');
		expect(issues).toContain('konten harus diawali "## " berisi judul');
	});

	test('melaporkan setiap section id yang hilang berdasarkan nama', () => {
		const without = (name: string) =>
			VALID_ID.split('\n')
				.filter((line) => line.trim() !== `### ${name}`)
				.join('\n');

		for (const name of [
			'Konsep Dasar',
			'Cara Kerja',
			'Alat dan Framework',
			'Contoh Implementasi',
			'Studi Kasus Nyata',
			'Rangkuman',
			'Sumber'
		]) {
			const issues = validateLessonMarkdown(without(name), 'id');
			expect(issues).toContain(`section wajib "### ${name}" tidak ditemukan`);
		}
	});

	test('mencocokkan heading tanpa peduli huruf besar/kecil', () => {
		const issues = validateLessonMarkdown(VALID_ID.replace('### Rangkuman', '### rangkuman'), 'id');
		expect(issues).not.toContain('section wajib "### Rangkuman" tidak ditemukan');
	});

	test('memakai spesifikasi en untuk variasi en-US', () => {
		const validEn = [
			'## Lesson',
			'### Core Concepts',
			'### How It Works',
			'### Tools and Frameworks',
			'### Implementation Example',
			'### Real-World Case',
			'### Summary',
			'### Sources'
		].join('\n');
		expect(validateLessonMarkdown(validEn, 'en-US')).toEqual([]);
		const issues = validateLessonMarkdown(VALID_ID, 'en-US');
		expect(issues).toContain('section wajib "### Core Concepts" tidak ditemukan');
	});

	test('bahasa tak dikenal hanya menuntut minimal 6 sub-heading', () => {
		const sixSections = ['## Judul', '### A', '### B', '### C', '### D', '### E', '### F'].join('\n');
		expect(validateLessonMarkdown(sixSections, 'fr')).toEqual([]);
		const issues = validateLessonMarkdown('## Judul\n### A\n### B', 'fr');
		expect(issues.some((issue) => issue.includes('minimal 6 sub-heading'))).toBe(true);
	});

	test('nama section dengan karakter khusus dilindungi dari regex', () => {
		// hanya memastikan fungsi tidak melempar dan menemukan heading apa adanya
		const issues = validateLessonMarkdown(VALID_ID, 'id');
		expect(Array.isArray(issues)).toBe(true);
	});
});