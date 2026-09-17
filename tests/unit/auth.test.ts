import { describe, expect, test } from 'bun:test';
import { verifyAdminToken } from '../../src/lib/server/auth';

describe('verifyAdminToken', () => {
	test('menerima token yang sama persis', () => {
		expect(verifyAdminToken('rahasia-dari-form', 'rahasia-dari-form')).toBe(true);
	});

	test('menolak token yang berbeda', () => {
		expect(verifyAdminToken('salah', 'rahasia')).toBe(false);
	});

	test('fail-closed: expected undefined atau string kosong selalu ditolak', () => {
		expect(verifyAdminToken('rahasia', undefined)).toBe(false);
		expect(verifyAdminToken('rahasia', '')).toBe(false);
		expect(verifyAdminToken('', '')).toBe(false);
	});

	test('kandidat beda panjang ditolak tanpa throw', () => {
		expect(verifyAdminToken(undefined, 'rahasia')).toBe(false);
		expect(verifyAdminToken('a', 'rahasia')).toBe(false);
		expect(verifyAdminToken('x'.repeat(64), 'rahasia')).toBe(false);
	});
});
