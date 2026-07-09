import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollMahjong, MIN_BET } from "@/lib/game";
import { safeEqual } from "@/lib/secure-compare";
import { isRateLimited } from "@/lib/rate-limit";

// Jeda minimal antar tarikan per user (ms). Ini bagian dari KUNCI ATOMIC di
// database (lihat komentar "claim" di bawah) — bukan cuma rate limiter biasa,
// jadi tetap berlaku benar walau ada banyak request PARALEL/bersamaan dari
// user yang sama (misalnya lewat DevTools/Chrome, curl, atau bot spam).
const PLAY_COOLDOWN_MS = 350;

// POST /api/mahjong/play
// body: { bet: number, discordId?: string, username?: string }
// - Dari web: pakai session, discordId diambil dari situ
// - Dari bot Discord: header "x-api-key" + body.discordId + body.username
//   (kalau user belum pernah login web, otomatis dibuatkan akun dgn saldo awal 1000)
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const body = await req.json().catch(() => ({}));
  const bet = Number(body.bet);
  const isDiscordAuth = !!process.env.API_SECRET && safeEqual(apiKey, process.env.API_SECRET);
  const source = isDiscordAuth ? "discord" : "web";

  let discordId: string | null = null;

  if (source === "discord") {
    discordId = typeof body.discordId === "string" ? body.discordId : null;
    if (!discordId) {
      return NextResponse.json({ error: "discordId wajib diisi" }, { status: 400 });
    }
    // pastikan user ada, kalau belum pernah login web -> buat baru
    await prisma.user.upsert({
      where: { discordId },
      update: {},
      create: {
        discordId,
        username: typeof body.username === "string" ? body.username : `user-${discordId}`,
        balance: 1000,
      },
    });
  } else {
    const session = await getServerSession(authOptions);
    discordId = (session?.user as any)?.discordId ?? null;
    if (!discordId) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
  }

  // Validasi bet: harus bilangan bulat positif >= MIN_BET. Ditolak di sini
  // (bukan cuma di client) supaya gak ada cara buat ngirim bet aneh
  // (desimal, negatif, NaN, Infinity, angka raksasa) langsung ke API.
  if (!Number.isInteger(bet) || bet < MIN_BET) {
    return NextResponse.json({ error: `Bet minimal ${MIN_BET} dan harus bilangan bulat` }, { status: 400 });
  }

  // Rate limit kasar per user, lapisan tambahan di luar kunci DB di bawah.
  if (isRateLimited(`play:${discordId}`, 10, 1000)) {
    return NextResponse.json({ error: "Terlalu cepat, tunggu sebentar." }, { status: 429 });
  }

  const betBig = BigInt(bet);

  // === KUNCI ANTI-RACE-CONDITION ===
  // Ini bagian paling penting. SEBELUMNYA kode baca `user.balance` dulu di JS,
  // baru hitung saldo baru dan nulis balik — kalau ada 2+ request nembak
  // BERSAMAAN (misal dari DevTools/script yang manggil endpoint ini berkali-
  // kali secara paralel), semuanya bisa baca saldo lama yang SAMA sebelum
  // salah satu sempat nulis, jadi taruhan bisa "dipakai berkali-kali" dan
  // saldo bisa digandakan padahal seharusnya udah abis / gak cukup.
  //
  // Fix-nya: klaim taruhan lewat SATU UPDATE atomik di database yang
  // syaratnya dicek ULANG oleh database itu sendiri saat eksekusi (bukan
  // dicek di JS lalu ditulis belakangan). Postgres ngunci row itu selama
  // UPDATE jalan, jadi request-request yang datang bersamaan otomatis
  // antre satu-satu, dan hanya yang benar-benar masih punya saldo cukup DAN
  // udah lewat cooldown yang berhasil "mengklaim" taruhannya.
  const claim = await prisma.user.updateMany({
    where: {
      discordId,
      balance: { gte: betBig },
      OR: [{ lastPlayAt: null }, { lastPlayAt: { lt: new Date(Date.now() - PLAY_COOLDOWN_MS) } }],
    },
    data: {
      balance: { decrement: betBig },
      lastPlayAt: new Date(),
    },
  });

// Di dalam fungsi play
// PASTIKAN variable 'user' sudah didefinisikan SEBELUMNYA
// Contoh: const user = await prisma.user.findUnique({ where: { discordId } });



// KODE ASLI - HANYA PAKAI GameConfig
const config = await prisma.gameConfig.findUnique({
  where: { id: "default" }
});

if (!config) {
  return NextResponse.json({ error: 'Game config not found' }, { status: 500 });
}

// Lanjutkan logika permainan yang udah ada
// (contoh: ambil outcomes dari config, hitung hasil, dll)

  if (claim.count === 0) {
    // Gagal klaim - cari tahu kenapa biar pesan errornya jelas (bukan bocorin
    // detail internal, cuma bedain "saldo kurang" vs "kecepetan").
    const current = await prisma.user.findUnique({ where: { discordId } });
    if (!current) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (current.balance < betBig) {
      return NextResponse.json({ error: "Saldo tidak cukup" }, { status: 400 });
    }
    return NextResponse.json({ error: "Terlalu cepat, tunggu sebentar." }, { status: 429 });
  }

  // Dari titik ini taruhan udah "dipotong" secara atomic di DB. Apapun yang
  // terjadi di bawah, kalau gagal harus di-refund biar saldo user gak ilang
  // percuma tanpa hasil tarikan yang tercatat.
  try {
    const result = await rollMahjong(bet);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { discordId },
        data: { balance: { increment: BigInt(result.payout) } },
      });
      await tx.play.create({
        data: {
          userId: u.id,
          bet: BigInt(result.bet),
          payout: BigInt(result.payout),
          net: BigInt(result.net),
          source,
        },
      });
      return u;
    });

    return NextResponse.json({
      tier: result.tier,
      label: result.label,
      bet: result.bet,
      payout: result.payout,
      net: result.net,
      balance: updated.balance.toString(),
    });
  } catch (err) {
    // Refund best-effort supaya user gak rugi taruhan yang udah diklaim tapi
    // gagal diproses (mis. error tak terduga di rollMahjong/DB).
    await prisma.user.update({
      where: { discordId },
      data: { balance: { increment: betBig } },
    }).catch(() => {});
    console.error("mahjong play error:", err);
    return NextResponse.json({ error: "Gagal memproses tarikan, coba lagi." }, { status: 500 });
  }
}
