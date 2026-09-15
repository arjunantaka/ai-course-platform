/**
 * Transport panggilan provider melalui proses anak (Bun).
 *
 * fetch maupun node:http di dalam SSR worker Vite dapat menggantung: koneksi terbentuk,
 * body terkirim penuh, tetapi tidak ada byte respons yang pernah diproses sampai timeout
 * 300 detik. Proses terpisah tidak pernah mengalami itu (semua probe eksternal selesai
 * 1-60 detik), jadi permintaan dijalankan di child process dan hasilnya dikembalikan lewat
 * stdout sebagai JSON satu baris.
 */
import { env } from '$env/dynamic/private';

type WorkerResult = { ok: boolean; status: number; body: string };

const WORKER_SCRIPT = `
const payload = JSON.parse(process.env.PROVIDER_PAYLOAD);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), payload.timeoutMs);
try {
	const res = await fetch(payload.url, {
		method: 'POST',
		headers: payload.headers,
		body: payload.body,
		signal: controller.signal
	});
	const body = await res.text();
	process.stdout.write(JSON.stringify({ ok: res.ok, status: res.status, body }));
} catch (e) {
	process.stdout.write(JSON.stringify({ ok: false, status: 0, body: e instanceof Error ? e.message : String(e) }));
} finally {
	clearTimeout(timer);
}
`;

export async function postViaChildProcess(
	url: string,
	headers: Record<string, string>,
	body: string,
	timeoutMs: number
): Promise<WorkerResult> {
	const payload = JSON.stringify({ url, headers, body, timeoutMs });
	const child = Bun.spawn(['bun', '-e', WORKER_SCRIPT], {
		stdout: 'pipe',
		stderr: 'pipe',
		env: { ...env, PROVIDER_PAYLOAD: payload } as Record<string, string>
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited
	]);
	if (exitCode !== 0) {
		throw new Error(
			`worker provider keluar dengan kode ${exitCode}: ${(stderr || stdout).slice(0, 400)}`
		);
	}
	const parsed = JSON.parse(stdout) as WorkerResult;
	return parsed;
}