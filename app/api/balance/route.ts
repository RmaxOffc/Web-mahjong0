import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeEqual } from "@/lib/secure-compare";
import { isRateLimited } from "@/lib/rate-limit";

// GET /api/balance
// - Dari web: pakai session login (Discord OAuth)
// - Dari bot Discord: header "x-api-key" + query "discordId"
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const discordIdParam = req.nextUrl.searchParams.get("discordId");

  let discordId: string | null = null;

  if (process.env.API_SECRET && safeEqual(apiKey, process.env.API_SECRET)) {
    // request dari bot Discord
    discordId = discordIdParam;
    if (!discordId) {
      return NextResponse.json({ error: "discordId wajib diisi" }, { status: 400 });
    }
  } else {
    // request dari web, cek session
    const session = await getServerSession(authOptions);
    discordId = (session?.user as any)?.discordId ?? null;
    if (!discordId) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
  }

  // Batasin request beruntun ke endpoint ini juga, biar gak dipakai buat
  // "polling" cepat/berulang yang gak perlu.
  if (isRateLimited(`balance:${discordId}`, 20, 1000)) {
    return NextResponse.json({ error: "Terlalu cepat, tunggu sebentar." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) {
    return NextResponse.json({ error: "User belum terdaftar" }, { status: 404 });
  }

  return NextResponse.json({
    discordId: user.discordId,
    username: user.username,
    balance: user.balance.toString(),
  });
}
