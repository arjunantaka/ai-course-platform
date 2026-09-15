# KrasCourse · Design Direction

Arah desain KrasCourse. Keputusan identitas di sini adalah sumber kebenaran; aturan
filter (antislop dsb.) berlaku di atasnya, bukan menggantikannya.

## Produk & audiens

Platform belajar mandiri berbahasa Indonesia: kurikulum dibuat pipeline AI, materi
dibaca, kuis dinilai langsung, tanpa akun. Audiens: pembelajar umum yang ingin mulai
cepat tanpa prosedur.

## Dials

`ENERGY 1 / RHYTHM 2 / MOTION 1`

- ENERGY 1: tenang, tipe editorial, satu aksen. Halaman menyapa lewat tipografi, bukan warna atau animasi.
- RHYTHM 2: grid konsisten dengan beberapa jeda (bagian values memakai baris divide-y, bukan kartu seragam).
- MOTION 1: hanya hover/active micro-feedback (hover naik 1px, tekan turun 1px, transisi warna). Tanpa scroll-reveal, tanpa loop.

## Palet

- Netral: zinc (background putih/zinc-50, teks zinc-900/700/600/500).
- Satu aksen: teal-600, khusus elemen interaktif utama dan penanda progres.
- Teks konten minimum zinc-500 (kontras ≥ 4.5:1 di putih); zinc-400 tidak pernah dipakai untuk teks nyata.

Alasan: pendidikan butuh kalm dan kontras tinggi; satu aksen membuat arah perhatian jelas.

## Tipografi

- UI: Plus Jakarta Sans. Alasan: humanist geometris yang ramah, cocok untuk produk edukasi Indonesia; bukan pilihan default model.
- Kode: JetBrains Mono.
- Heading: extrabold tracking-tight, `text-wrap: balance`.

## Radius (variasi sebagai hierarki)

| Elemen | Radius | Alasan |
|---|---|---|
| Tombol CTA primer | `rounded-full` | Satu radius generous yang disengaja sebagai tanda interaksi utama |
| Input | `rounded-lg` | Field netral, tidak bersaing dengan CTA |
| Opsi jawaban kuis | `rounded-xl` | Baris lebar yang bisa diklik; pill membuat opsi seperti chip |
| Kartu/panel | `rounded-2xl` | Kontainer konten |
| Badge label kecil | `rounded-md` | Label status, bukan tombol |

## Identitas visual (motif)

Cover kursus: gradien duo-warna deterministik dari hash slug + inisial judul besar
(`coverGradient`/`titleInitials`). Motif ini berulang di semua kartu, halaman detail,
dan lesson. Tidak ada foto/gambar stok, sesuai brief owner.

## Tema

Light only (keputusan owner, eksplisit). Tidak ada toggle dark mode.

## Suara copywriting

Bahasa Indonesia lugas: kalimat pendek, sebut aktor, sebut manfaat nyata, tanpa
buzzword, tanpa klaim tidak berdasar, tanpa tanda seru berlebihan. Progress dan skor
selalu angka nyata dari data, bukan angka pemanis.
