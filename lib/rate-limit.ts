// Rate limiter sederhana berbasis memory (sliding window per key, misalnya
// per discordId atau per IP). Ini LAPISAN PERTAMA aja buat nahan spam request
// yang kasar (misalnya script yang nembak endpoint ratusan kali per detik).
//
// PENTING - keterbatasan: ini nyimpen state di memory proses Node, jadi:
// - Kalau di-deploy multi-instance / serverless (Vercel functions, dsb),
//   tiap instance punya counter sendiri-sendiri, jadi limitnya efektif
//   dikali jumlah instance. Untuk itu, JANGAN andalkan ini sebagai satu-
//   satunya proteksi terhadap race condition saldo koin — proteksi utama
//   ada di database (lihat app/api/mahjong/play/route.ts yang pakai
//   atomic conditional update + lastPlayAt). Rate limiter ini cuma bikin
//   pola serangan jadi lebih repot & ngurangin noise/log spam, bukan
//   satu-satunya garda pertahanan.
// - Kalau butuh rate limit yang akurat lintas instance, pindahin ke
//   penyimpanan bersama (Redis/Upstash) dengan logika yang sama.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Bersihin bucket lama biar memory gak numpuk terus (best-effort).
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 5 * 60_000) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
