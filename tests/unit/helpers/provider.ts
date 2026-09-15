import { mock } from 'bun:test';

export type CapturedRequest = {
	url: string;
	headers: Record<string, string>;
	body: string;
	timeoutMs: number;
};

/**
 * Rekam pemanggilan postViaChildProcess dan balas respons berurutan.
 * Respons terakhir diulang bila permintaan melebihi daftar.
 */
export function stubProvider(responses: Array<{ status: number; body: string }>): CapturedRequest[] {
	const requests: CapturedRequest[] = [];
	let index = 0;
	mock.module('$lib/server/ai/provider-worker', () => ({
		postViaChildProcess: async (
			url: string,
			headers: Record<string, string>,
			body: string,
			timeoutMs: number
		) => {
			requests.push({ url, headers, body, timeoutMs });
			const next = responses[Math.min(index, responses.length - 1)]!;
			index++;
			return { ok: next.status >= 200 && next.status < 300, status: next.status, body: next.body };
		}
	}));
	return requests;
}