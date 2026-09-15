# Delayed Task Tracker: codebase-rapikan-refactor

Snapshot progres eksekusi plan `codebase-rapikan-refactor` (durable copy
`local://codebase-rapikan-refactor-plan.md`, inline plan di turn awal).

Git: repo diinit pada commit `6fb06e4` (baseline + semua edit A/B sudah ter-commit).

Legenda: `[x]` selesai, `[~]` berjalan/rebuild, `[ ]` belum.

---

## A. Fixes + refactors (no behavior change)

| Step | Status | Catatan |
|---|---|---|
| 1. Admin dashboard wrapped-div balance | [x] | Sudah seimbang (`</table></div>{/if}`); didapat saat penulisan ulang template → no-op. |
| 2. Admin dashboard polling parity + inline error | [x] | `generation` state + `$effect` poll per baris + `invalidateAll` saat selesai; error inline di kolom Status. |
| 3. Shared admin action handler + confirm modal | [x] | Kedua halaman: `pendingDelete` modal (Batal/Hapus), `actionError` bar; `busy` guard di detail. |
| 4. `doneLessons` increment clamp | [x] | `sql\`MIN(${...}+1, ${...totalLessons})\`` di `writeLesson`. |
| 5. `chatJson` retry transcript cleanup | [x] | `cleaned` un-fence sebelum append ke `messages`. |
| 6. Safe JSON column reads | [x] | `getModuleQuiz` + `getCourseTree` try/catch; `reviewNotes` `$derived.by` fallback `[]`. |
| 7. POST /api/admin/courses Slice 7 codes | – | Superseded oleh Step 8. |
| 8. `apiError` helper + `{code,message}` | [x] | `src/lib/server/api.ts`; 4 route + lessons route; reader `body.message`. |
| 9. Unify admin create flow (hapus API duplikat) | [x] | `rm src/routes/api/admin/courses/+server.ts`; grep → no consumers. |
| 10. Guard clauses / zod-issues joiner | [x] | No-op: inline pattern sudah dipakai, dibiarkan (sesuai plan). |
| 11. ProgressStore single-instance guard | [x] | `initialized` guard di constructor; default export sama. |
| 12. hooks.server.ts stall sweep | [x] | UPDATE 30-menit ditambahkan; banner comment dirapikan. |
| 13. Svelte 5 `$derived` conformance audit | [ ] | Belum dijalankan (perlu re-read; plan prediksi no-edit). |
| 14. README env-name fix | [x] | `AI_MODEL_PLANNER`/`AI_MODEL_TEXT`; bullet fitur otomatis-AI. |
| 15. `slugify` FTS collision retry | – | DITOLAK (plan): tak ada edit. |

## B. Tests + end-to-end smoke

| Item | Status | Catatan |
|---|---|---|
| `src/lib/server/ai/client.ts` `_testable` | [x] | `{ parseJsonLoose, balancedJsonEnd, extractContent }`. |
| `src/lib/server/ai/generate.ts` `_testable` | [x] | `{ validateLessonMarkdown }`. |
| `tests/unit/helpers/db.ts` | [x] | temp sqlite + migrasi + reset. |
| `tests/unit/helpers/env.ts` | [x] | pengganti `$env/dynamic/private` via tsconfig paths. |
| `tests/unit/helpers/provider.ts` | [x] | stub `postViaChildProcess` + capture request. |
| `tests/unit/client.test.ts` | [~] | 11 green; 1 gagal (retry transcript): timeout 5s. |
| `tests/unit/markdown.test.ts` | [~] | Valid-lengkap pass; 4 fail: `_testable` ter-poison oleh mock `generate.ts` dari courses.test. |
| `tests/unit/courses.test.ts` | [x] | 7/7 pass. |
| tsconfig paths (`$lib`, `$env/dynamic/private`) | [x] | untuk `bun test`; cek svelte-check 0/0 setelahnya. |
| `package.json` scripts `test`/`test:unit`/`smoke` | [x] | |
| `scripts/smoke.sh` | [ ] | Belum ditulis. |

## Root cause kegagalan test (aktif)

1. **Mock poisoning antar-file** (`markdown.test.ts` 4 fail): `courses.test.ts`
   memanggil `mock.module('$lib/server/ai/generate', ...)` yang menimpa `_testable`
   untuk seluruh proses bun test. Fix: jalankan `mock.module` hanya di dalam
   describe miliknya / batasi cakupan, atau gunakan file test terpisah, atau
   `mock.restore()` per suite dan jangan mock `_testable` di courses (mock hanya
   `startGeneration`).

2. **Client retry timeout 5s**: `chatJson` retry memanggil `backoffDelay` (2s) di
   jalur retryable sebelum parsing? Tidak: raw malformed → parse throw → bukan
   HTTP error → masuk branch follow-up (tanpa backoff). Dugaan: respons kedua
   `{"ok": "salah"}` lolos `OkSchema` (boolean? `"salah"` bukan boolean → gagal
   validasi → loop lagi → respons ketiga = ulang terakhir `{"ok": "salah"}`,
   gagal → MAX_ATTEMPTS → throw; tapi 6× tanpa backoff cepat, bukan 5s timeout).
   Perlu inspeksi: kemungkinan `stubProvider` return `ok:false` (status 200 di
   branch kedua dipakai; index melewati array → `responses[-1]` undefined).
   Fix: beri 6+ respons atau buat skema yang lolos, dan pastikan stub tak
   mengembalikan undefined.

## Langkah berikut

1. Perbaiki 2 kegagalan test di atas (mock poisoning + retry stub) sampai
   `bun test tests/unit` → all pass.
2. Jalankan Step 13 audit (re-read, konfirmasi no-edit).
3. Re-run `svelte-check` → 0/0 (validasi tsconfig paths tak merusak jenis).
4. Tulis `scripts/smoke.sh`, `chmod +x`, jalankan → `smoke OK`.
5. Commit akhir; ringkas verifikasi 4 poin di turn penutup.