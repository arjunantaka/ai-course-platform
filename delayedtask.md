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
| `scripts/smoke.sh` | [x] | Ditulis + jalur non-generate diverifikasi (auth, CSRF login, create→303, status awal, 409 invalid_status, delete→404). Bagian draft→publish→render→quiz butuh model real (mock dihapus). |

## Root cause kegagalan test (sudah ditangani)

1. **Mock poisoning antar-file** — fix: hapus `mock.module('$lib/server/ai/generate', ...)` di
   `courses.test.ts` (test tak memanggil createCourse/startGeneration).
2. **Client retry timeout** — akar masalah NYATA: `isRetryableHttp` mengklasifikasikan error
   JSON/Zod (Error polos) sebagai retryable → branch koreksi follow-up Step 5 tak pernah
   tercapai. Fix: perkenalkan `NetworkError` (dilempar `postViaChildProcess` saat status 0);
   `isRetryableHttp` kini hanya true untuk NetworkError / HTTP 429 / 5xx. Follow-up kini aktif.
   `bun test tests/unit` → 19 pass, exit 0.

## Perubahan eksternal (agent lain, repo sama)

- **Agent `pi` (Orca) menghapus provider `mock`** dari codebase: `src/lib/server/ai/mock.ts`
  tak ada, `client.ts` tak lagi punya branch `if (provider === 'mock')` / `AI_PROVIDER` env.
  Pipeline kini selalu openai real via `postViaChildProcess`. Perubahan ini KOMIT di baseline
  (working tree pi menimpa sebelum git init), jadi `git status` bersih saat ini.
- Akibat: `scripts/smoke.sh` tak bisa memakai `AI_PROVIDER=mock`; verifikasi penuh butuh
  kredensial model real. E2E provider-real sedang dikerjakan pi (task `task_f4c5b60d538b`).
- Koordinasi terkirim via `orca orchestration send` (request ID `03884a43-...`).

## Langkah berikut

1. [x] Perbaiki 2 kegagalan test → `bun test tests/unit` = 19 pass, exit 0.
2. [x] Step 13 audit → konfirmasi no-edit (semua prop-derived sudah `$derived`).
3. [x] `svelte-check` → 0 errors / 0 warnings (dengan tsconfig `paths` utk bun test).
4. [x] Tulis `scripts/smoke.sh` (ORIGIN fix untuk CSRF + jalur adaptif) + verifikasi jalur
       non-generate: auth gate 303, login fail `status:400`, cookie, create→303, status awal
       `generating_outline`, 409 `{code:'invalid_status'}`, delete→404.
5. [ ] Jalur render/quiz smoke → terblokir karena mock dihapus; butuh model real.
       Tumpang tindih dengan e2e real pi. Diserahkan ke pi.
6. [~] Commit akhir + laporan verifikasi (turn ini).