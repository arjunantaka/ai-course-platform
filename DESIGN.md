# KrasCourse · Design Direction

Arah desain KrasCourse. Keputusan identitas di sini adalah sumber kebenaran; aturan
filter (antislop dsb.) berlaku di atasnya, bukan menggantikannya.

## Produk & audiens

Platform belajar mandiri berbahasa Indonesia: kurikulum dibuat pipeline AI, materi
dibaca, kuis dinilai langsung, tanpa akun. Audiens: pembelajar umum yang ingin mulai
cepat tanpa prosedur.

## Arah: Papan Tulis

Identitas lahir dari dunia kelas Indonesia: papan tulis, kapur, kotak centang, lembar
nilai. Papan hijau adalah objek di halaman terang (terbingkai, dengan bayangan),
bukan tema gelap. Prototype sumber kebenaran visual: `prototypes/c-papan-tulis.html`
(dipilih owner 2026-09-16 dari tiga arah; A Buku Tulis dan B Rapor tidak terpilih).

## Dials

`ENERGY 2 / RHYTHM 2 / MOTION 1`

- ENERGY 2: papan memberi kehadiran visual lewat objek dan kontras, bukan animasi; tipografi kapur yang bekerja.
- RHYTHM 2: komposisi bervariasi (kartu unggulan lebar + kartu sedang, baris modul bergaris putus) tanpa menjadi montase.
- MOTION 1: hanya hover/active micro-feedback (hover naik 1-2px, tekan turun 1px, transisi warna 150-160ms). Tanpa scroll-reveal, tanpa loop.

## Palet

- Kertas: zinc-50/putih; teks zinc-900/700/600/500 (minimum zinc-500, kontras ≥ 4.5:1; zinc-400 tidak pernah untuk teks nyata).
- Papan (token Tailwind): `board #1B3B33`, `chalk #EDEEE8`, `chalk-dim #B9C5BE`, `chalk-teal #8FD8CB`, `frame #E7E5DC`. Semua pasangan teks-papan lolos AA.
- Bingkai papan: border 9px `frame` + bayangan tinted `rgba(22,49,41,.45)`.
- Satu aksen terang: teal-700 `#0F766E` untuk elemen interaktif utama dan penanda progres. Bukan teal-600: putih di teal-600 hanya 3.74:1 (gagal AA), di teal-700 5.47:1.
- Merah hanya status jawaban salah kuis (fungsional, bukan dekorasi).

Alasan: papan adalah artefak kelas yang langsung dikenali pembelajar Indonesia; identitas kuat tanpa keluar dari light mode (keputusan owner).

## Tipografi

- UI: Plus Jakarta Sans. Alasan: humanist geometris yang ramah, cocok untuk produk edukasi Indonesia; bukan pilihan default model.
- Kode: JetBrains Mono.
- Heading: extrabold tracking-tight, `text-wrap: balance`.
- Teks di papan tetap Plus Jakarta Sans (bukan font tulisan tangan): konsisten dengan sistem, tanpa dependensi font baru.

## Radius (variasi sebagai hierarki)

| Elemen | Radius | Alasan |
|---|---|---|
| Papan (hero, cover, panel nilai) | `rounded` (4px) + bingkai `frame` | Objek berbingkai yang kaku, kontras dengan permukaan terang |
| Tombol CTA & input | `rounded-lg` | Satu radius interaksi, tidak bersaing dengan papan |
| Opsi jawaban kuis | `rounded-lg` | Baris lebar yang bisa diklik, konsisten dengan tombol |
| Kartu/panel terang | `rounded-xl` | Kontainer konten |
| Badge label kecil | `rounded-md` | Label status, bukan tombol |
| Kotak centang progres | `rounded` (4px) | Echo papan: centang kecil yang kaku |

## Identitas visual (motif)

- Cover kursus = papan kecil bertulisan kapur: inisial besar (`titleInitials`) di
  atas, baris mono kecil `N MODUL · M LESSON` di bawah, permukaan `.board`. Gradien
  `coverGradient` dihapus (cutover bersih); tidak ada foto/gambar stok sesuai brief
  owner.
- Garis bawah kapur: satu SVG stroke melengkung di bawah kata kunci hero.
  Satu-satunya SVG dekoratif di produk; bukan ikon, tidak digandakan.
- Progres = deretan kotak centang (checkbox strip), bukan progress bar terisi.
- Kode dan nilai kuis "ditulis di papan": `pre` dan panel nilai memakai `.board`
  dengan teks kapur.
- Kuis = lembar ujian: kop bergaris tebal, nomor soal (urutan nyata), kunci jawaban
  kotak, pembahasan berlabel mono `PEMBAHASAN`.

## Tema

Light only (keputusan owner, eksplisit). Tidak ada toggle dark mode. Papan adalah
objek di halaman terang; tidak ada section gelap selebar layar dan tidak ada
pergantian tema di tengah halaman.

## Suara copywriting

Bahasa Indonesia lugas: kalimat pendek, sebut aktor, sebut manfaat nyata, tanpa
buzzword, tanpa klaim tidak berdasar, tanpa tanda seru berlebihan. Progress dan skor
selalu angka nyata dari data, bukan angka pemanis.
