import type { CourseLevel, CourseStatus } from '$lib/server/db/schema';

/** Slug URL dari judul: lowercase, non-alfanumerik → '-', plus suffix acak 6 char base36. */
export function slugify(title: string): string {
	const base =
		title
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^\p{L}\p{N}]+/gu, '-')
			.replace(/^-+|-+$/g, '') || 'kursus';
	const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
	return `${base}-${suffix}`;
}
/** Inisial 1-2 huruf dari judul, ditulis kapur besar di cover papan. */
export function titleInitials(title: string): string {
	const words = title.split(/\s+/).filter(Boolean);
	if (words.length === 0) return 'K';
	if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
	return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export const LEVEL_LABELS: Record<CourseLevel, string> = {
	beginner: 'Pemula',
	intermediate: 'Menengah',
	advanced: 'Lanjutan'
};

export const STATUS_LABELS: Record<CourseStatus, string> = {
	generating_outline: 'Menyusun outline',
	generating_content: 'Generate materi',
	failed: 'Gagal',
	draft: 'Draft',
	published: 'Terbit',
	archived: 'Diarsipkan'
};
