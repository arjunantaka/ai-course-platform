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

/** Gradien 2 warna deterministik dari hash slug, cover kursus tanpa gambar. */
export function coverGradient(slug: string): string {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
	}
	const hue = hash % 360;
	const second = (hue + 45) % 360;
	return `linear-gradient(135deg, hsl(${hue} 72% 42%), hsl(${second} 65% 26%))`;
}

/** Inisial 1-2 huruf dari judul, ditampilkan besar di cover. */
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
