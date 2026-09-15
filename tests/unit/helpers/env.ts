// Pengganti virtual $env/dynamic/private untuk bun test (dipetakan lewat tsconfig paths).
// Kredensial palsu; postViaChildProcess di-stub oleh helper
// sehingga tidak ada network nyata saat test.
export const env: Record<string, string | undefined> = {
	AI_BASE_URL: 'http://provider.test/v1',
	AI_API_KEY: 'test-key',
	AI_MODEL_PLANNER: 'test-planner',
	AI_MODEL_TEXT: 'test-text',
	DB_PATH: process.env.DB_PATH
};
