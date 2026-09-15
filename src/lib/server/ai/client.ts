import { env } from '$env/dynamic/private';
import type { z } from 'zod';
import { postViaChildProcess } from './provider-worker';

/**
 * Satu-satunya permukaan ke provider AI (9router, OpenAI-compatible).
 * Seluruh keanehan kompatibilitas provider ditangani di file ini:
 * retry, fallback tanpa response_format, dan toleransi body SSE.
 */

// Router bersama kadang butuh lebih dari 4 menit untuk satu permintaan, dan sebagian
// permintaan tidak pernah dijawab. Anggaran percobaan dibuat lapang supaya pipeline
// tidak gagal hanya karena satu permintaan lambat.
const MAX_ATTEMPTS = 6;
const NETWORK_BACKOFF_MS = [2000, 5000];

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

/** Error HTTP dari provider; membawa status untuk klasifikasi retry. */
class ProviderHttpError extends Error {
	constructor(
		readonly status: number,
		body: string
	) {
		super(`HTTP ${status}: ${body.slice(0, 200)}`);
	}
}

/** Gagal jaringan dari postViaChildProcess (status 0): layak dicoba ulang. */
class NetworkError extends Error {}

function requireOpenAiEnv(): { baseUrl: string; apiKey: string } {
	if (!env.AI_BASE_URL || !env.AI_API_KEY) {
		throw new Error(
			'AI_BASE_URL dan AI_API_KEY wajib di-set (endpoint OpenAI-compatible)'
		);
	}
	return { baseUrl: env.AI_BASE_URL.replace(/\/$/, ''), apiKey: env.AI_API_KEY };
}

function isUnsupportedResponseFormat(e: unknown): boolean {
	return e instanceof Error && e.message.includes('response_format');
}

/** 4xx selain 429: kesalahan permintaan, ulangi tidak akan membantu. */
function isHardHttpError(e: unknown): boolean {
	return e instanceof ProviderHttpError && e.status !== 429 && e.status < 500;
}

/** Gagal jaringan atau 5xx/429: layak dicoba ulang. Error lain (JSON/Zod) bukan. */
function isRetryableHttp(e: unknown): boolean {
	if (e instanceof NetworkError) return true;
	if (e instanceof ProviderHttpError) {
		return e.status === 429 || e.status >= 500;
	}
	return false;
}

function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

/** Backoff jaringan: 2s lalu 5s pada percobaan berikutnya. */
function backoffDelay(attempt: number): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	setTimeout(resolve, NETWORK_BACKOFF_MS[Math.min(attempt - 1, NETWORK_BACKOFF_MS.length - 1)]);
	return promise;
}

/** Ambil blok JSON dari respons model: buang code fence bila ada, lalu parse. */
function parseJsonLoose(raw: string): unknown {
	let text = raw.trim();
	const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
	if (fence) text = fence[1]!.trim();
	return JSON.parse(text);
}

type ChatCompletionFrame = {
	choices?: Array<{
		message?: { content?: string | null };
		delta?: { content?: string | null };
	}>;
};

/** Indeks kurung penutup objek JSON pertama yang seimbang, -1 bila tidak ada. */
function balancedJsonEnd(text: string, start: number): number {
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let i = start; i < text.length; i++) {
		const ch = text[i];
		if (inString) {
			if (escaped) escaped = false;
			else if (ch === '\\') escaped = true;
			else if (ch === '"') inString = false;
			continue;
		}
		if (ch === '"') inString = true;
		else if (ch === '{' || ch === '[') depth++;
		else if (ch === '}' || ch === ']') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/**
 * Router kadang menjawab body SSE (data: {...} + [DONE]) untuk request non-streaming.
 * Dukung kedua format: JSON utuh, atau aliran delta yang digabung jadi satu konten.
 */
function extractContent(body: string): string {
	const trimmed = body.trim();
	// deteksi SSE longgar: baris data: bisa didahului event:/id: milik producer lain
	if (!/^data:/m.test(trimmed)) {
		let data: ChatCompletionFrame;
		try {
			data = JSON.parse(trimmed) as ChatCompletionFrame;
		} catch (cause) {
			// router kadang menempel data ekor (mis. "data: [DONE]") setelah JSON utuh;
			// ambil objek JSON pertama yang seimbang lalu parse potongan itu
			const start = trimmed.indexOf('{');
			const end = start === -1 ? -1 : balancedJsonEnd(trimmed, start);
			if (end === -1) {
				throw new Error(`respons bukan JSON: ${trimmed.slice(0, 160)} ... ${trimmed.slice(-60)}`, { cause });
			}
			try {
				data = JSON.parse(trimmed.slice(start, end + 1)) as ChatCompletionFrame;
			} catch (cause2) {
				throw new Error(`respons bukan JSON: ${trimmed.slice(0, 160)} ... ${trimmed.slice(-60)}`, { cause: cause2 });
			}
		}
		const content = data.choices?.[0]?.message?.content;
		if (!content) throw new Error(`respons model kosong: ${trimmed.slice(0, 200)}`);
		return content;
	}
	let deltaContent = '';
	let messageContent: string | null = null;
	for (const line of trimmed.split(/\r?\n/)) {
		const payload = line.replace(/^data:\s*/, '').trim();
		if (!payload || payload === '[DONE]') continue;
		let chunk: ChatCompletionFrame;
		try {
			chunk = JSON.parse(payload) as ChatCompletionFrame;
		} catch {
			continue; // frame terpotong: lewati, konten dari frame utuh tetap terpakai
		}
		const choice = chunk.choices?.[0];
		if (choice?.delta?.content) deltaContent += choice.delta.content;
		if (choice?.message?.content) messageContent = choice.message.content;
	}
	const content = messageContent ?? deltaContent;
	if (!content) throw new Error(`respons SSE tanpa konten: ${trimmed.slice(0, 200)}`);
	return content;
}
/** Tier model: planner untuk keputusan struktur (outline/review), text untuk materi panjang. */
export type ModelTier = 'planner' | 'text';

function resolveModel(tier: ModelTier): string {
	const model = tier === 'planner' ? env.AI_MODEL_PLANNER : env.AI_MODEL_TEXT;
	if (!model) throw new Error(`env AI_MODEL_${tier.toUpperCase()} belum di-set`);
	return model;
}

async function complete(messages: Msg[], jsonMode: boolean, tier: ModelTier): Promise<string> {
	const { baseUrl, apiKey } = requireOpenAiEnv();
	const body = JSON.stringify({
		model: resolveModel(tier),
		messages,
		// JANGAN set max_tokens: model reasoning membakar ratusan token reasoning
		// sebelum konten; budget kecil menghasilkan konten kosong finish_reason length.
		...(jsonMode ? { response_format: { type: 'json_object' as const } } : {})
	});
	// reasoning planner bisa memikirkan lebih dari 4 menit di router yang sibuk
	const TIMEOUT_MS = 600_000;
	const result = await postViaChildProcess(
		`${baseUrl}/chat/completions`,
		{ 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
		body,
		TIMEOUT_MS
	);
	if (result.status === 0) throw new NetworkError(result.body);
	if (!result.ok) throw new ProviderHttpError(result.status, result.body);
	return extractContent(result.body);
}

export async function chatJson<T>(
	system: string,
	user: string,
	schema: z.ZodType<T>,
	tier: ModelTier = 'text'
): Promise<T> {
	let useJsonMode = true;
	let attempt = 0;
	let messages: Msg[] = [
		{ role: 'system', content: system },
		{ role: 'user', content: user }
	];

	while (true) {
		attempt++;
		let raw = '';
		try {
			raw = await complete(messages, useJsonMode, tier);
			return schema.parse(parseJsonLoose(raw));
		} catch (e) {
			const message = errorMessage(e);
			console.warn(`[client] chatJson percobaan ${attempt} gagal: ${message.slice(0, 200)} | raw: ${raw.slice(0, 240) || '(kosong)'}`);
			if (isUnsupportedResponseFormat(e)) {
				// provider menolak response_format → ulangi permintaan yang sama tanpa field itu
				useJsonMode = false;
				attempt--;
				continue;
			}
			if (attempt >= MAX_ATTEMPTS) {
				throw new Error(`chatJson gagal setelah ${MAX_ATTEMPTS} percobaan: ${message}`);
			}
			if (isHardHttpError(e)) throw e;
			if (isRetryableHttp(e)) {
				await backoffDelay(attempt);
				continue;
			}
			// JSON tidak valid / gagal validasi skema → minta koreksi dengan pesan follow-up
			const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
			messages = [
				...messages,
				{ role: 'assistant', content: cleaned || raw },
				{
					role: 'user',
					content: `Jawaban sebelumnya tidak valid: ${message}. Balas HANYA JSON valid yang sesuai skema, tanpa teks lain.`
				}
			];
		}
	}
}

export async function chatText(system: string, user: string, tier: ModelTier = 'text'): Promise<string> {
	let attempt = 0;
	while (true) {
		attempt++;
		try {
			return await complete(
				[
					{ role: 'system', content: system },
					{ role: 'user', content: user }
				],
				false,
				tier
			);
		} catch (e) {
			const message = errorMessage(e);
			if (attempt >= MAX_ATTEMPTS) {
				throw new Error(`chatText gagal setelah ${MAX_ATTEMPTS} percobaan: ${message}`);
			}
			if (isHardHttpError(e)) throw e;
			if (isRetryableHttp(e)) {
				await backoffDelay(attempt);
				continue;
			}
			throw e;
		}
	}
}

/** Permukaan internal untuk unit test; tidak dipakai kode aplikasi. */
export const _testable = { parseJsonLoose, balancedJsonEnd, extractContent };
