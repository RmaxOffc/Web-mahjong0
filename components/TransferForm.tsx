"use client";

import { useState } from "react";

export default function TransferForm() {
  const [toDiscordId, setToDiscordId] = useState("");
  const [amount, setAmount] = useState(10);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toDiscordId, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsError(false);
        setMsg(`Berhasil kirim ${amount.toLocaleString("id-ID")} koin. Saldo sekarang: ${Number(data.balance).toLocaleString("id-ID")}`);
        setToDiscordId("");
      } else {
        setIsError(true);
        setMsg(data.error ?? "Gagal kirim koin.");
      }
    } catch {
      setIsError(true);
      setMsg("Koneksi bermasalah, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const quickAmounts = [10, 50, 100, 500];

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-lacquer2/70 border border-gold/30 p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-ivory/50">Kirim Koin</p>
          <p className="text-lg font-display font-bold gold-text">Transfer ke Pemain Lain</p>
        </div>
        <div className="text-3xl seal-stamp text-ember/80 select-none">送</div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-ivory/50 mb-1 block">Discord ID Tujuan</label>
          <input
            type="text"
            placeholder="cth: 123456789012345678"
            value={toDiscordId}
            onChange={(e) => setToDiscordId(e.target.value)}
            className="w-full bg-lacquer border border-gold/30 rounded-lg px-3 py-2 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="text-xs text-ivory/50 mb-1 block">Jumlah Koin</label>
          <div className="flex gap-2 mb-2">
            {quickAmounts.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                  amount === a
                    ? "bg-gold text-lacquer border-gold"
                    : "border-gold/30 text-ivory/80 hover:border-gold/60"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={10}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-lacquer border border-gold/30 rounded-lg px-3 py-2 text-ivory focus:outline-none focus:border-gold"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading || !toDiscordId || amount < 10}
          className="w-full py-3 rounded-lg bg-ember hover:bg-ember2 disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-display font-bold tracking-wide shadow-emberglow transition"
        >
          {loading ? "Mengirim…" : "Kirim Koin"}
        </button>

        {msg && (
          <p className={`text-sm ${isError ? "text-ember2" : "text-jade2"}`}>{msg}</p>
        )}

        <p className="text-xs text-ivory/40">Transfer minimal 10 koin. Pastikan Discord ID tujuan benar, transfer tidak bisa dibatalkan.</p>
      </div>
    </div>
  );
          }
