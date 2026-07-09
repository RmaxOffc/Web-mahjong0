import { prisma } from "./prisma";

// Logika inti "tarikan mahjong". Dipakai oleh /api/mahjong/play — baik web
// maupun bot Discord lewat endpoint yang sama, jadi hasilnya konsisten.
//
// Tabel peluang & payout sekarang DIAMBIL DARI DATABASE (tabel GameConfig),
// bukan hardcode lagi, jadi bisa diubah kapan aja lewat halaman /admin atau
// endpoint /api/admin/config tanpa perlu redeploy.

export const MIN_BET = 10;

export interface OutcomeConfig {
  tier: string;
  label: string;
  payout: number;
  chance: number; // fraksi 0-1, semua tier harus jumlahnya 1 (=100%)
}

// Dipakai kalau tabel GameConfig di database masih kosong (pertama kali jalan).
// Ini contoh default yang SUDAH termasuk peluang kalah, silakan diubah lewat /admin.
export const DEFAULT_OUTCOMES: OutcomeConfig[] = [
  { tier: "lose", label: "Kalah", payout: 0, chance: 0.55 },
  { tier: "small", label: "Bunga (花)", payout: 400, chance: 0.30 },
  { tier: "big", label: "Naga (龍)", payout: 10_000, chance: 0.12 },
  { tier: "jackpot", label: "Naga Emas (金龍)", payout: 100_000, chance: 0.03 },
];

const CACHE_TTL_MS = 15_000; // biar gak query DB tiap tarikan, tapi tetap responsif kalau diubah
let cache: { outcomes: OutcomeConfig[]; fetchedAt: number } | null = null;

export async function getOutcomes(): Promise<OutcomeConfig[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.outcomes;
  }

  const row = await prisma.gameConfig.findUnique({ where: { id: "default" } });
  const outcomes = (row?.outcomes as unknown as OutcomeConfig[]) ?? DEFAULT_OUTCOMES;
  cache = { outcomes, fetchedAt: Date.now() };
  return outcomes;
}

export function invalidateOutcomesCache() {
  cache = null;
}

export function validateOutcomes(outcomes: OutcomeConfig[]): string | null {
  if (!Array.isArray(outcomes) || outcomes.length === 0) return "Minimal harus ada 1 tier.";
  let total = 0;
  for (const o of outcomes) {
    if (!o.tier || !o.label) return "Setiap tier wajib punya tier id & label.";
    if (typeof o.payout !== "number" || o.payout < 0) return `Payout tier "${o.label}" gak valid.`;
    if (typeof o.chance !== "number" || o.chance < 0 || o.chance > 1) {
      return `Peluang tier "${o.label}" harus antara 0-1 (mis. 0.55 = 55%).`;
    }
    total += o.chance;
  }
  // toleransi pembulatan kecil
  if (Math.abs(total - 1) > 0.001) {
    return `Total peluang harus 100%. Sekarang totalnya ${(total * 100).toFixed(2)}%.`;
  }
  return null;
}

export interface MahjongResult {
  tier: string;
  label: string;
  payout: number;
  bet: number;
  net: number;
}

export async function rollMahjong(bet: number): Promise<MahjongResult> {
  if (!Number.isFinite(bet) || bet < MIN_BET) {
    throw new Error(`Bet minimal ${MIN_BET}`);
  }

  const outcomes = await getOutcomes();

  const roll = Math.random();
  let cumulative = 0;
  for (const outcome of outcomes) {
    cumulative += outcome.chance;
    if (roll <= cumulative) {
      return {
        tier: outcome.tier,
        label: outcome.label,
        payout: outcome.payout,
        bet,
        net: outcome.payout - bet,
      };
    }
  }
  // fallback (floating point edge case) -> tier terakhir
  const last = outcomes[outcomes.length - 1];
  return {
    tier: last.tier,
    label: last.label,
    payout: last.payout,
    bet,
    net: last.payout - bet,
  };
}
