import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { z } from 'zod';
import type { _testable as ClientTestable, chatJson } from '../../src/lib/server/ai/client';
import { stubProvider, type CapturedRequest } from './helpers/provider';

const chatCompletion = (content: string): string =>
	JSON.stringify({ choices: [{ message: { content } }] });

const OkSchema = z.object({ ok: z.boolean() });

let captured: CapturedRequest[];
let run: typeof chatJson;
let _testable: typeof ClientTestable;

beforeEach(async () => {
	mock.restore();
	captured = stubProvider([
		{ status: 200, body: chatCompletion('{"ok": true}') },
		{ status: 200, body: chatCompletion('{"ok": true}') }
	]);
	// impor dinamis: modul harus dimuat setelah postViaChildProcess di-mock
	({ chatJson: run, _testable } = await import('../../src/lib/server/ai/client'));
});

afterAll(() => mock.restore());

describe('parseJsonLoose', () => {
	test('mengupas code fence dan memparse isinya', () => {
		expect(_testable.parseJsonLoose('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
	});

	test('memparse JSON polos', () => {
		expect(_testable.parseJsonLoose('{"a": [1, 2]}')).toEqual({ a: [1, 2] });
	});

	test('melempar pada teks yang diapit fence tetapi isinya rusak', () => {
		expect(() => _testable.parseJsonLoose('```json\n{a: }\n```')).toThrow();
	});
});

describe('balancedJsonEnd', () => {
	test('menemukan akhir objek JSON yang seimbang', () => {
		const text = '{"a": 1}';
		expect(_testable.balancedJsonEnd(text, 0)).toBe(text.length - 1);
	});

	test('mengabaikan kurung di dalam string dan escape', () => {
		const text = '{"a": "}}}\\"}", "b": 2}';
		expect(_testable.balancedJsonEnd(text, 0)).toBe(text.length - 1);
	});

	test('mengembalikan -1 saat kurung tidak seimbang', () => {
		expect(_testable.balancedJsonEnd('{"a": 1', 0)).toBe(-1);
	});
});

describe('extractContent', () => {
	test('mengambil content dari JSON utuh', () => {
		expect(_testable.extractContent(chatCompletion('halo'))).toBe('halo');
	});

	test('memulihkan JSON yang ditempeli ekor data: [DONE]', () => {
		const body = `${chatCompletion('halo')}\ndata: [DONE]`;
		expect(_testable.extractContent(body)).toBe('halo');
	});

	test('menggabungkan delta dari body SSE', () => {
		const body = [
			'data: {"choices":[{"delta":{"content":"ha"}}]}',
			'data: {"choices":[{"delta":{"content":"lo"}}]}',
			'data: [DONE]'
		].join('\n');
		expect(_testable.extractContent(body)).toBe('halo');
	});

	test('melempar saat content kosong', () => {
		expect(() => _testable.extractContent(chatCompletion(''))).toThrow(/kosong/);
	});

	test('melempar saat tidak ada JSON yang bisa diparse', () => {
		expect(() => _testable.extractContent('bukan json sama sekali')).toThrow(/bukan JSON/);
	});
});

describe('chatJson retry', () => {
	test('transkrip koreksi memakai raw tanpa fence, bukan mentah', async () => {
		const fencedMalformed = '```json\n{"ok": "salah", "n": }\n```';
		captured = stubProvider([
			{ status: 200, body: chatCompletion(fencedMalformed) },
			{ status: 200, body: chatCompletion('{"ok": "salah"}') }
		]);
		const { chatJson: runAgain, _testable: _t } = await import('../../src/lib/server/ai/client');
		expect(_t).toBeDefined();

		const result = await runAgain('sys', 'user', OkSchema);

		expect(result).toEqual({ ok: 'salah' });
		expect(captured.length).toBe(2);
		const secondMessages = JSON.parse(captured[1]!.body).messages as Array<{
			role: string;
			content: string;
		}>;
		const assistant = secondMessages.filter((m) => m.role === 'assistant').at(-1)!;
		expect(assistant.content).toBe('{"ok": "salah", "n": }');
		expect(assistant.content).not.toContain('```');
	});
});