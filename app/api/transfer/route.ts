import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

const MIN_TRANSFER = 10;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const fromDiscordId = (session?.user as any)?.discordId ?? null;
  if (!fromDiscordId) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const toDiscordId = typeof body.toDiscordId === "string" ? body.toDiscordId : null;
  const amount = Number(body.amount);

  if (!toDiscordId) return NextResponse.json({ error: "Tujuan transfer wajib diisi" }, { status: 400 });
  if (toDiscordId === fromDiscordId) return NextResponse.json({ error: "Gak bisa transfer ke diri sendiri" }, { status: 400 });
  if (!Number.isInteger(amount) || amount < MIN_TRANSFER) {
    return NextResponse.json({ error: `Transfer minimal ${MIN_TRANSFER} koin` }, { status: 400 });
  }
  if (isRateLimited(`transfer:${fromDiscordId}`, 5, 2000)) {
    return NextResponse.json({ error: "Terlalu cepat, tunggu sebentar." }, { status: 429 });
  }

  const amountBig = BigInt(amount);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Klaim atomic dari saldo pengirim - pola sama kayak /api/mahjong/play,
      // supaya aman dari race condition kalau ada beberapa transfer bareng.
      const claim = await tx.user.updateMany({
        where: { discordId: fromDiscordId, balance: { gte: amountBig } },
        data: { balance: { decrement: amountBig } },
      });
      if (claim.count === 0) throw new Error("INSUFFICIENT_BALANCE");

      const to = await tx.user.findUnique({ where: { discordId: toDiscordId } });
      if (!to) throw new Error("RECIPIENT_NOT_FOUND");

      await tx.user.update({ where: { discordId: toDiscordId }, data: { balance: { increment: amountBig } } });
      await tx.transfer.create({ data: { fromId: fromDiscordId, toId: toDiscordId, amount: amountBig } });

      return tx.user.findUniqueOrThrow({ where: { discordId: fromDiscordId } });
    });

    return NextResponse.json({ balance: result.balance.toString() });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: "Saldo tidak cukup" }, { status: 400 });
    if (err.message === "RECIPIENT_NOT_FOUND") return NextResponse.json({ error: "User tujuan gak ditemukan" }, { status: 404 });
    console.error("transfer error:", err);
    return NextResponse.json({ error: "Transfer gagal, coba lagi." }, { status: 500 });
  }
                                             }
