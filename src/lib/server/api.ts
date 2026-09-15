import { json } from '@sveltejs/kit';

export function apiError(status: number, code: string, message: string): Response {
	return json({ code, message }, { status });
}