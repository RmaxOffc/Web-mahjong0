import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminDiscordId } from "@/lib/admin";
import { safeEqual } from "@/lib/secure-compare";

async function checkAdmin(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (process.env.API_SECRET && safeEqual(apiKey, process.env.API_SECRET)) return true;
  const session = await getServerSession(authOptions);
  return isAdminDiscordId((session?.user as any)?.discordId ?? null);
}

// GET /api/admin/users?q=nama-atau-discordId
export async function GET(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ username: { contains: q, mode: "insensitive" } }, { discordId: { contains: q } }] } : undefined,
    take: 20,
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    users: users.map((u) => ({ discordId: u.discordId, username: u.username, balance: u.balance.toString() })),
  });
}

// POST /api/admin/users  { discordId, mode: "set" | "add", amount, reason? }
export async function POST(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const discordId = typeof body.discordId === "string" ? body.discordId : null;
  const mode = body.mode === "set" || body.mode === "add" ? body.mode : null;
  const amount = Number(body.amount);
  const reason = typeof body.reason === "string" ? body.reason : null;

  if (!discordId) return NextResponse.json({ error: "discordId wajib diisi" }, { status: 400 });
  if (!mode) return NextResponse.json({ error: "mode harus 'set' atau 'add'" }, { status: 400 });
  if (!Number.isInteger(amount) || (mode === "set" && amount < 0)) {
    return NextResponse.json({ error: "Amount harus bilangan bulat" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const adminId = (session?.user as any)?.discordId ?? "api-key";

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { discordId } });
      if (!user) throw new Error("NOT_FOUND");

      const newBalanceIfSet = BigInt(Math.max(0, amount));
      const u =
        mode === "set"
          ? await tx.user.update({ where: { discordId }, data: { balance: newBalanceIfSet } })
          : await tx.user.update({ where: { discordId }, data: { balance: { increment: BigInt(amount) } } });

      // Kalau mode "add" bikin saldo minus (misal admin ngurangin kebanyakan), floor ke 0.
      const clamped = u.balance < BigInt(0) ? await tx.user.update({ where: { discordId }, data: { balance: BigInt(0) } }) : u;

      await tx.adminAction.create({
        data: {
          adminId,
          targetId: discordId,
          amount: BigInt(mode === "set" ? Number(newBalanceIfSet) - Number(user.balance) : amount),
          reason,
        },
      });

      return clamped;
    });

    return NextResponse.json({ discordId: updated.discordId, balance: updated.balance.toString() });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return NextResponse.json({ error: "User gak ditemukan" }, { status: 404 });
    console.error("admin edit balance error:", err);
    return NextResponse.json({ error: "Gagal update saldo" }, { status: 500 });
  }
    }
