import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminDiscordId } from "@/lib/admin";
import { safeEqual } from "@/lib/secure-compare";
import { DEFAULT_OUTCOMES, validateOutcomes, invalidateOutcomesCache, OutcomeConfig } from "@/lib/game";

async function checkAuthorized(req: NextRequest): Promise<boolean> {
  const apiKey = req.headers.get("x-api-key");
  if (process.env.API_SECRET && safeEqual(apiKey, process.env.API_SECRET)) return true;

  const session = await getServerSession(authOptions);
  const discordId = (session?.user as any)?.discordId ?? null;
  return isAdminDiscordId(discordId);
}

export async function GET(req: NextRequest) {
  if (!(await checkAuthorized(req))) {
    return NextResponse.json({ error: "Bukan admin." }, { status: 403 });
  }
  const row = await prisma.gameConfig.findUnique({ where: { id: "default" } });
  const outcomes = (row?.outcomes as unknown as OutcomeConfig[]) ?? DEFAULT_OUTCOMES;
  return NextResponse.json({ outcomes });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuthorized(req))) {
    return NextResponse.json({ error: "Bukan admin." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const outcomes = body?.outcomes as OutcomeConfig[] | undefined;
  if (!outcomes) {
    return NextResponse.json({ error: "Body harus punya field 'outcomes'." }, { status: 400 });
  }

  const err = validateOutcomes(outcomes);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  await prisma.gameConfig.upsert({
    where: { id: "default" },
    update: { outcomes: outcomes as any },
    create: { id: "default", outcomes: outcomes as any },
  });
  invalidateOutcomesCache();

  return NextResponse.json({ ok: true, outcomes });
}
