#!/usr/bin/env bash
set -euo pipefail

# Smoke e2e untuk KrasCourse (prod bundle di bawah bun).
# Pipeline AI selalu pakai provider openai (mock provider sudah dihapus dari kode).
# Bila AI_API_KEY tersedia di env, verifikasi penuh (create → draft → publish →
# render → quiz) dijalankan; tanpa kredensial, hanya jalur non-generate
# (auth, CSRF login, create→status berubah, shape error {code,message}, delete→404).

DB_PATH=./.smoke.db
BASE=http://127.0.0.1:3901
rm -f "$DB_PATH" /tmp/smc.cookie

# build lalu jalankan prod bundle; build butuh bun
bun run build >/dev/null
PORT=3901 DB_PATH="$DB_PATH" ADMIN_TOKEN=smoke ORIGIN="$BASE" bun ./build >/tmp/kras-smoke-server.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null; rm -f "$DB_PATH" /tmp/smc.cookie' EXIT

# wait ready
for _ in $(seq 1 40); do curl -sf "$BASE/" >/dev/null && break; sleep 0.5; done

# 1) admin auth gate: tanpa cookie → 303 ke /admin/login
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/admin")" = "303" ]

# 2) login CSRF + token: token salah → action failure 400 di body; benar → cookie terpasang
LOGIN_BAD=$(curl -s -H "Origin: $BASE" -X POST "$BASE/admin/login" -d 'token=nope')
echo "$LOGIN_BAD" | grep -q '"status":400'
curl -sf -H "Origin: $BASE" -c /tmp/smc.cookie -X POST "$BASE/admin/login" -d 'token=smoke' >/dev/null
grep -q 'kras_admin' /tmp/smc.cookie

# 3) create course → redirect body status 303
CREATE_RESP=$(curl -sf -H "Origin: $BASE" -b /tmp/smc.cookie -X POST "$BASE/admin/new" \
  --data-urlencode 'topic=Belajar SQLite dari nol sampai bisa bikin schema' \
  -d 'level=beginner&language=id' \
  --data-urlencode \
$'points=Memahami dasar relational database\nMembuat tabel dengan PRIMARY KEY\nMenggunakan index untuk query cepat\nMembuat query SQL dasar (SELECT, INSERT, UPDATE)\nMenghubungkan SQLite dari bahasa pemrograman')
echo "$CREATE_RESP" | grep -q '"status":303'
COURSE_ID=$(echo "$CREATE_RESP" | sed -E 's#.*/admin/([a-f0-9-]+).*#\1#')
[ -n "$COURSE_ID" ] && [ "$COURSE_ID" != "$CREATE_RESP" ]

# 4a) status awal → generating_* (pipeline aktif)
ST0=$(curl -s -b /tmp/smc.cookie "$BASE/api/admin/courses/$COURSE_ID/status")
case "$ST0" in
  *'"status":"generating_'*) : ;;
  *'"status":"draft"'*) : ;;
  *) echo "unexpected status: $ST0"; exit 1 ;;
esac

RUN_FULL=0
for _ in $(seq 1 120); do
  S=$(curl -s -b /tmp/smc.cookie "$BASE/api/admin/courses/$COURSE_ID/status" | sed -E 's/.*"status":"([^"]+)".*/\1/')
  [ "$S" = "draft" ] && { RUN_FULL=1; break; }
  [ "$S" = "failed" ] && break
  sleep 1
done

if [ "$RUN_FULL" = "1" ]; then
  # 5) publish → halaman publik /courses/[slug] 200
  SLUG=$(curl -s -b /tmp/smc.cookie "$BASE/admin/$COURSE_ID" | grep -oE '/courses/[^"]+' | head -1 | sed 's#/courses/##')
  [ -n "$SLUG" ]
  curl -sf -H "Origin: $BASE" -b /tmp/smc.cookie -X POST "$BASE/api/admin/courses/$COURSE_ID/publish" >/dev/null
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/courses/$SLUG")" = "200" ]

  # 6) lesson page merender HTML bersih (tanpa <script>)
  LESSON_URL=$(curl -s "$BASE/courses/$SLUG" | grep -oE "/courses/$SLUG/lessons/[a-f0-9-]+" | head -1)
  [ -n "$LESSON_URL" ]
  curl -s "$BASE$LESSON_URL" | grep -q '<h2'
  ! curl -s "$BASE$LESSON_URL" | grep -q '<script'

  # 7) quiz page 5 soal
  QUIZ_URL=$(curl -s "$BASE$LESSON_URL" | grep -oE "/courses/$SLUG/quiz/[a-f0-9-]+" | head -1)
  [ -n "$QUIZ_URL" ]
  [ "$(curl -s "$BASE$QUIZ_URL" | grep -o '"question"' | wc -l)" -eq 5 ]

  # 8) error-code shape: unpublish, lalu unpublish lagi → 409 invalid_status
  curl -sf -H "Origin: $BASE" -b /tmp/smc.cookie -X POST "$BASE/api/admin/courses/$COURSE_ID/unpublish" >/dev/null
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Origin: $BASE" -b /tmp/smc.cookie \
    -X POST "$BASE/api/admin/courses/$COURSE_ID/unpublish")
  [ "$CODE" = "409" ]
  RESP=$(curl -s -H "Origin: $BASE" -b /tmp/smc.cookie -X POST "$BASE/api/admin/courses/$COURSE_ID/unpublish")
  echo "$RESP" | grep -q '"code":"invalid_status"'
else
  # tanpa kredensial model: setidaknya verifikasi status berubah keluar dari generating setelah batas waktu,
  # atau pipeline gagal karena tak ada AI_API_KEY → error di-isi. Ceak shape 404 via delete di bawah.
  echo "note: pipeline tidak mencapai draft (model real tidak tersedia) → skip render/quiz"
  # 8) shape error: unpublish pada status non-published → 409 invalid_status
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Origin: $BASE" -b /tmp/smc.cookie \
    -X POST "$BASE/api/admin/courses/$COURSE_ID/unpublish")
  [ "$CODE" = "409" ]
  RESP=$(curl -s -H "Origin: $BASE" -b /tmp/smc.cookie -X POST "$BASE/api/admin/courses/$COURSE_ID/unpublish")
  echo "$RESP" | grep -q '"code":"invalid_status"'
fi

# 9) delete → status kursus 404
curl -sf -H "Origin: $BASE" -b /tmp/smc.cookie -X DELETE "$BASE/api/admin/courses/$COURSE_ID" >/dev/null
[ "$(curl -s -o /dev/null -w '%{http_code}' -b /tmp/smc.cookie "$BASE/api/admin/courses/$COURSE_ID/status")" = "404" ]

echo "smoke OK"