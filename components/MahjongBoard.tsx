"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MahjongTile from "./MahjongTile";

const TIER_SYMBOL: Record<string, string> = {
  lose: "散", // buyar/kalah
  small: "花", // bunga
  big: "龍", // naga
  jackpot: "金龍", // naga emas
};

const TIER_GLOW: Record<string, "gold" | "ember" | "jade" | "none"> = {
  lose: "none",
  small: "jade",
  big: "ember",
  jackpot: "gold",
};

interface Props {
  initialBalance: number;
}

export default function MahjongBoard({ initialBalance }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [bet, setBet] = useState(10);
  const [rolling, setRolling] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<null | {
    tier: string;
    label: string;
    payout: number;
    bet: number;
    net: number;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  async function play() {
    setError(null);
    if (bet < 10) {
      setError("Bet minimal 10 koin.");
      return;
    }
    if (bet > balance) {
      setError("Saldo kamu gak cukup.");
      return;
    }

    setRolling(true);
    setRevealed(false);
    setResult(null);

    try {
      const res = await fetch("/api/mahjong/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal main, coba lagi.");
        setRolling(false);
        return;
      }

      // biar animasi kocok ubinnya kerasa dulu sebelum kebuka
      setTimeout(() => {
        setResult(data);
        setBalance(Number(data.balance));
        setRevealed(true);
        setRolling(false);
      }, 900);
    } catch {
      setError("Koneksi bermasalah, coba lagi.");
      setRolling(false);
    }
  }

  const quickBets = [10, 50, 100, 500];

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-lacquer2/70 border border-gold/30 p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-ivory/50">Saldo koin</p>
          <p className="text-2xl font-display font-bold gold-text">{balance.toLocaleString("id-ID")}</p>
        </div>
        <div className="text-4xl seal-stamp text-ember/80 select-none">牌</div>
      </div>

      {/* Papan ubin */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 py-8">
        {[0, 1, 2].map((i) => (
          <MahjongTile
            key={i}
            revealed={revealed}
            symbol={result ? TIER_SYMBOL[result.tier] : undefined}
            glow={result ? TIER_GLOW[result.tier] : "none"}
            delay={i * 0.08}
          />
        ))}
      </div>

      <AnimatePresence>
        {result && revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-6"
          >
            <p className="font-display text-lg text-gold2">{result.label}</p>
            <p className="text-ivory/80 text-sm">
              {result.payout > 0 ? (
                <>
                  Menang <span className="text-jade2 font-semibold">+{result.payout.toLocaleString("id-ID")}</span>{" "}
                  (taruhan {result.bet.toLocaleString("id-ID")})
                </>
              ) : (
                <>
                  Kalah, taruhan <span className="text-ember2 font-semibold">{result.bet.toLocaleString("id-ID")}</span> hangus
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kontrol taruhan */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {quickBets.map((b) => (
            <button
              key={b}
              onClick={() => setBet(b)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                bet === b
                  ? "bg-gold text-lacquer border-gold"
                  : "border-gold/30 text-ivory/80 hover:border-gold/60"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min={10}
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
            className="flex-1 bg-lacquer border border-gold/30 rounded-lg px-3 py-2 text-ivory focus:outline-none focus:border-gold"
          />
          <button
            onClick={play}
            disabled={rolling}
            className="px-6 py-2 rounded-lg bg-ember hover:bg-ember2 disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-display font-bold tracking-wide shadow-emberglow transition"
          >
            {rolling ? "Mengocok…" : "Tarik"}
          </button>
        </div>

        {error && <p className="text-sm text-ember2">{error}</p>}
        <p className="text-xs text-ivory/40">Bet minimal 10 koin. Ini koin virtual, bukan uang asli.</p>
      </div>
    </div>
  );
}
