"use client";

import { useState, useEffect } from "react";

interface Player {
  id: string;
  username: string;
  balance: number;
  maxBigWin: number;
}

interface Tier {
  tier: string;
  label: string;
  payout: number;
  chance: number;
}

interface WinRateConfig {
  [tierKey: string]: number;
}

interface PlayerWinRateModalProps {
  player: Player;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlayerWinRateModal({ player, onClose, onSuccess }: PlayerWinRateModalProps) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [winRates, setWinRates] = useState<WinRateConfig>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    // Fetch config tiers
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.outcomes) {
          setTiers(data.outcomes);
          // Initialize win rates with default values (chance * 100)
          const initialRates: WinRateConfig = {};
          data.outcomes.forEach((outcome: Tier) => {
            initialRates[outcome.tier] = Math.round(outcome.chance * 100);
          });
          setWinRates(initialRates);
        }
      })
      .catch((err) => {
        console.error("Error fetching config:", err);
        setMessage({ type: "err", text: "Gagal memuat konfigurasi" });
      });
  }, []);

  const handleWinRateChange = (tierKey: string, value: string) => {
    setWinRates((prev) => ({
      ...prev,
      [tierKey]: Math.max(0, Math.min(100, parseInt(value) || 0)),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/win-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: player.id,
          winRates: winRates,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal menyimpan" });
      } else {
        setMessage({ type: "ok", text: "Win rate berhasil disimpan!" });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: "err", text: `Error: ${err}` });
    } finally {
      setLoading(false);
    }
  };

  const totalWinRate = Object.values(winRates).reduce((a, b) => a + b, 0) / tiers.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-lacquer2 to-lacquer border border-gold/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gold/20 to-transparent border-b border-gold/20 p-6 flex items-center justify-between backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-bold gold-text">🎯 Atur Win Rate</h2>
            <p className="text-ivory/60 text-sm mt-1">Player: <span className="text-gold font-semibold">{player.username}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/60 hover:text-ivory text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message Alert */}
          {message && (
            <div
              className={`p-4 rounded-lg text-sm font-medium ${
                message.type === "ok"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}
            >
              {message.type === "ok" ? "✅" : "❌"} {message.text}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-black/30 border border-ivory/10 rounded-lg p-4">
            <p className="text-ivory/70 text-sm leading-relaxed">
              Atur persentase kemenangan untuk setiap outcome. Total rata-rata akan ditampilkan di bawah. 
              <span className="block mt-2 text-ivory/50 text-xs">
                💡 Tips: Sesuaikan berdasarkan peluang dasar di "Atur Peluang & Payout"
              </span>
            </p>
          </div>

          {/* Tiers Table */}
          {tiers.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ivory/80">📊 Outcome Tiers</h3>
              <div className="space-y-2 bg-black/20 rounded-lg p-4 border border-ivory/10">
                {tiers.map((tier) => (
                  <div
                    key={tier.tier}
                    className="bg-white/5 border border-ivory/10 rounded-lg p-4 hover:bg-white/8 transition"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-ivory/60 text-xs uppercase tracking-wider mb-1">
                          Outcome
                        </p>
                        <p className="text-ivory font-semibold">{tier.label}</p>
                        <p className="text-ivory/40 text-xs mt-1">ID: {tier.tier}</p>
                      </div>
                      <div>
                        <p className="text-ivory/60 text-xs uppercase tracking-wider mb-1">
                          Payout
                        </p>
                        <p className="text-gold font-bold text-lg">{tier.payout}x</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-ivory/60 text-xs uppercase tracking-wider block">
                        Peluang Kemenangan
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={winRates[tier.tier] || 0}
                          onChange={(e) =>
                            handleWinRateChange(tier.tier, e.target.value)
                          }
                          disabled={loading}
                          className="flex-1 h-2 bg-black/50 rounded-lg accent-gold cursor-pointer disabled:opacity-50"
                        />
                        <div className="flex items-center gap-2 min-w-20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={winRates[tier.tier] || 0}
                            onChange={(e) =>
                              handleWinRateChange(tier.tier, e.target.value)
                            }
                            disabled={loading}
                            className="w-16 bg-black/50 border border-ivory/20 rounded px-2 py-1 text-center text-ivory text-sm disabled:opacity-50"
                          />
                          <span className="text-ivory/60 text-sm">%</span>
                        </div>
                      </div>

                      {/* Baseline chance */}
                      <p className="text-ivory/40 text-xs mt-2">
                        📌 Baseline: {Math.round(tier.chance * 100)}% (dari Atur Peluang & Payout)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-black/30 border border-ivory/10 rounded-lg p-8 text-center">
              <p className="text-ivory/50">Memuat konfigurasi...</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300/60 text-xs uppercase tracking-wider mb-1">
                Rata-rata Win Rate
              </p>
              <p className="text-blue-300 font-bold text-2xl">
                {totalWinRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-300/60 text-xs uppercase tracking-wider mb-1">
                Total Tiers
              </p>
              <p className="text-purple-300 font-bold text-2xl">{tiers.length}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-lacquer to-transparent border-t border-gold/20 p-6 flex gap-3 justify-end backdrop-blur-sm">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 rounded-lg border border-ivory/30 text-ivory hover:bg-white/5 disabled:opacity-50 transition font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading || tiers.length === 0}
            className="px-8 py-2 rounded-lg bg-gradient-to-r from-gold to-gold2 text-lacquer hover:opacity-90 disabled:opacity-50 transition font-semibold"
          >
            {loading ? "Menyimpan..." : "💾 Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
