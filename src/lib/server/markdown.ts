import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Render markdown kursus → HTML aman (marked → sanitize-html).
 * Dipakai untuk semua konten publik; konten admin dirender terpisah di sisi client.
 */
export function renderMarkdown(markdown: string): string {
	const html = marked.parse(markdown, { async: false, gfm: true });
	return sanitizeHtml(html, {
		allowedTags: [
			...sanitizeHtml.defaults.allowedTags,
			'h1',
			'h2',
			'h3',
			'h4',
			'pre',
			'code',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
			'hr'
		],
		allowedAttributes: { code: ['class'], a: ['href', 'rel'] }
	});
}
