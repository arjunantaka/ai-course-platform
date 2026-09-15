# KrasCourse

Platform belajar mandiri berbahasa Indonesia: admin memberi topik dan daftar poin
pembelajaran, pipeline AI mengkategorikan poin menjadi modul (kategori skill),
me-review dan memangkas poin yang kurang relevan, lalu menulis materi tiap lesson
satu per satu dan membuat kuis per modul. Materi bisa dibaca dan kuis dikerjakan
tanpa akun; progres belajar tersimpan di perangkat pengguna, bukan di server.

## Fitur

- **Generate kursus dari poin pembelajaran**: admin menulis topik + 5-30 poin (satu per baris); AI mengelompokkan poin menjadi modul kategori skill (maksimal 8 modul, 8 lesson per modul), memangkas poin tidak relevan (tercatat di halaman admin), menulis materi berstruktur per lesson, dan membuat kuis per modul
- **Editor admin**: tinjau hasil generate dan catatan review AI, edit markdown tiap lesson dengan pratinjau, terbitkan atau tarik publikasi
- **Halaman publik**: katalog dengan pencarian (judul/topik/tag), detail kursus + kurikulum, reader lesson dengan navigasi prev/next, kuis pilihan ganda dengan pembahasan instan
- **Progres tanpa akun**: lesson selesai dan skor kuis tersimpan di localStorage
- **Status pipeline**: `generating_outline` (kategorisasi + review AI) → `generating_content` → `draft` → `published`, dengan recovery otomatis saat server restart

## Teknologi

| Lapisan | Pilihan |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes), TypeScript |
| Styling | Tailwind CSS v4, Plus Jakarta Sans + JetBrains Mono |
| Database | SQLite via Drizzle ORM (driver `bun:sqlite`), migrasi otomatis saat boot |
| AI | Endpoint OpenAI-compatible (mis. 9router): tier planner untuk struktur, tier text untuk materi |
| Runtime | Bun |
| Konten | `marked` + `sanitize-html` (konten publik dirender server-side, sudah disanitasi) |

## Menjalankan

Prasyarat: [Bun](https://bun.sh) 1.x.

```sh
bun install
cp .env.example .env
bun run dev
```

Dev server berjalan di http://localhost:5173.

Env penting (daftar lengkap di `.env.example`):

- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL_PLANNER`, `AI_MODEL_TEXT`: wajib; planner untuk kategorisasi + review outline, text untuk materi lesson dan kuis
- `ADMIN_TOKEN`: token masuk `/admin` (wajib diganti di produksi)
- `DB_PATH`, `PORT`, `HOST`, `ORIGIN`: opsional, ada default

## Admin

Buka `/admin` dan masukkan `ADMIN_TOKEN`. Dari sana: buat kursus (pipeline berjalan
asinkron dengan indikator progres), tinjau dan edit konten per lesson, lalu terbitkan.
Kursus muncul di beranda dan katalog setelah statusnya `published`.

> Pipeline memanggil provider untuk tiap tahap; pastikan endpoint dan API key sudah benar sebelum membuat kursus.

## Skrip

| Perintah | Fungsi |
|---|---|
| `bun run dev` | Dev server (Vite) |
| `bun run build` | Build produksi (adapter-node, output `build/`) |
| `bun run start` | Jalankan hasil build (HOST tetap `127.0.0.1`, ORIGIN mengikuti `PORT`) |
| `bun run check` | svelte-check + sinkronisasi tipe |
| `bun run db:generate` | Generate migrasi Drizzle dari schema |

## Struktur

```
src/
├── routes/          # halaman publik (beranda, katalog, detail, lesson, kuis), admin, API
├── lib/
│   ├── CourseCard.svelte, LessonTree.svelte  # komponen UI
│   ├── progress.svelte.ts                    # store progres (localStorage)
│   ├── utils.ts                              # coverGradient, label level/status
│   └── server/                               # query DB, pipeline AI, markdown
└── app.css          # Tailwind + tipografi konten + style global
```

## Deploy

`Dockerfile` tersedia (dua tahap, runtime `oven/bun`):

```sh
docker build -t krascourse .

# Server di dalam container me-bind 127.0.0.1, jadi pakai jaringan host
# (Linux) agar bisa diakses; tetap tanpa bind 0.0.0.0.
docker run --network host \
  -e ADMIN_TOKEN=ganti-saya \
  -e AI_BASE_URL=http://host-anda:20128/v1 \
  -v krascourse-data:/app/data \
  krascourse
```

Aplikasi kemudian listen di `127.0.0.1:3000` di mesin host; taruh reverse proxy
di depannya untuk ekspos ke publik. Sesuaikan `ORIGIN` bila domain proxy berbeda.
Volume `/app/data` menyimpan file SQLite.

## Desain

Arah visual, dials, sistem radius, dan suara copywriting terdokumentasi di
[`DESIGN.md`](./DESIGN.md). Audit anti-slop (UI, kode, copywriting) ada di
[`anti-slop/`](./anti-slop/).
