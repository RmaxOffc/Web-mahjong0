# Mahjong Coin — Web (Next.js, siap deploy ke Vercel)

## Jalanin lokal

```bash
npm install
cp .env.example .env    # isi semua value-nya
npx prisma db push      # bikin tabel di database
npm run dev
```

Buka http://localhost:3000

## Setup Discord OAuth

1. https://discord.com/developers/applications → New Application
2. Tab **OAuth2** → catat `Client ID` & `Client Secret`
3. Di **Redirects**, tambahin:
   - `http://localhost:3000/api/auth/callback/discord` (buat lokal)
   - `https://domain-vercel-kamu.vercel.app/api/auth/callback/discord` (buat production, tambahin setelah deploy)

## Setup Database

Pakai Postgres gratisan yang serverless-friendly, contoh:
- https://neon.tech
- https://supabase.com

Ambil connection string-nya, taruh di `DATABASE_URL`.

## Deploy ke Vercel

1. Push folder ini (atau seluruh repo) ke GitHub
2. Di Vercel → **Import Project** → pilih repo
3. Kalau `web` bukan root repo, set **Root Directory** ke `web`
4. Isi Environment Variables (sama kayak `.env`, tapi `NEXTAUTH_URL` diisi URL Vercel kamu, contoh `https://mahjong-coin.vercel.app`)
5. Deploy
6. Setelah live, balik lagi ke Discord Developer Portal, tambahin redirect URL production-nya (langkah di atas)

## Atur peluang & payout (`/admin`)

1. Login ke web pakai Discord
2. Pastikan Discord user ID kamu ada di env `ADMIN_DISCORD_IDS` (pisah koma kalau lebih dari satu)
3. Buka `/admin` → ubah label, payout, dan persentase tiap tier (termasuk tier "Kalah")
4. Total persentase harus pas 100%, baru bisa disimpan

Data ini disimpan di tabel `GameConfig` dan langsung dipakai baik dari web maupun bot Discord (ada cache 15 detik di server biar gak query DB tiap tarikan).

## Yang dipakai bot Discord dari sini

Bot (`/bot`) manggil 2 endpoint di app ini:
- `GET /api/balance?discordId=xxx` (header `x-api-key: <API_SECRET>`)
- `POST /api/mahjong/play` body `{ discordId, username, bet }` (header `x-api-key: <API_SECRET>`)

Pastikan `API_SECRET` di sini sama persis dengan `API_SECRET` di `bot/.env`.
