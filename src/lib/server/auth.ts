import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Bandingkan token admin konstan-waktu supaya panjang/awalan token tidak
 * bocor lewat waktu respons. Kedua sisi di-hash dulu karena timingSafeEqual
 * melempar bila buffer beda panjang. Token kosong atau belum di-set selalu
 * ditolak (fail-closed).
 */
export function verifyAdminToken(
	candidate: string | undefined,
	expected: string | undefined
): boolean {
	if (!expected || candidate === undefined) return false;
	const candidateHash = createHash('sha256').update(candidate).digest();
	const expectedHash = createHash('sha256').update(expected).digest();
	return timingSafeEqual(candidateHash, expectedHash);
}
