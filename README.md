# Hi, Joy! 🍓

Satu file `index.html`, tanpa build. Dunia 3D dari blok (Three.js dari CDN), musik kotak musik Web Audio, amplop "buka kalau…", tulis ke bulan, dan kirim foto.

## Pengaturan (paling atas `<script type="module">` di `index.html`)
- `WORKER_URL`: URL Cloudflare Worker buat kirim foto & tulisan. Kalau kosong, website bilang jujur kalau kotaknya belum tersambung (tombol simpan foto tetap jalan).
- `BIRTHDAY`: ulang tahun Joy, format `'MM-DD'`. Kalau diisi, di hari itu muncul banner, confetti, dan amplop ulang tahun bisa dibuka.

## Pasang Worker
1. Cloudflare → Workers & Pages → Create → Worker baru (mis. `kotak-joy`), tempel isi `worker/worker.js`, Deploy.
2. Settings → Variables and Secrets:
   - `BOT_TOKEN` (Secret): token bot dari @BotFather
   - `CHAT_ID` (Text): ID chat pribadimu
   - `ALLOWED_ORIGIN` (Text): origin website Joy, mis. `https://namamu.github.io` (tanpa garis miring di akhir)
3. Salin URL Worker ke `WORKER_URL` di `index.html`.

Token tidak pernah ditulis di kode website.

## Lihat di lokal
```
python3 -m http.server 8777
```
lalu buka http://localhost:8777. Lompat ke bab tertentu: `#bab0` … `#bab10`.
