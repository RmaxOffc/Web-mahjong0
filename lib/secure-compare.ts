import crypto from "crypto";

/**
 * Bandingin dua string secara timing-safe (gak bisa ditebak lewat selisih
 * waktu respons). Dipakai buat cek header x-api-key vs process.env.API_SECRET.
 *
 * Kenapa perlu: `a === b` biasa berhenti di karakter pertama yang beda,
 * jadi teorinya penyerang bisa nebak secret karakter-per-karakter dari
 * selisih waktu respons (timing attack). Ini best-practice standar untuk
 * apapun yang membandingkan secret/token.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // tetap jalanin timingSafeEqual walau panjang beda (dibandingkan ke
    // dirinya sendiri) biar gak bocor info panjang lewat timing juga.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
