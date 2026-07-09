"use client";

import { useEffect, useState } from "react";

interface Tier {
  tier: string;
  label: string;
  payout: number;
  chancePercent: number; // ditampilkan sebagai persen di UI, disimpan sebagai fraksi ke API
}

export default function AdminConfigForm() {
  const [tiers, setTiers] = useState<Tier[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.outcomes) {
          setTiers(
            data.outcomes.map((o: any) => ({
              tier: o.tier,
              label: o.label,
              payout: o.payout,
              chancePercent: Math.round(o.chance * 10000) / 100,
            }))
          );
        }
      });
  }, []);

  const total = tiers?.reduce((sum, t) => sum + t.chancePercent, 0) ?? 0;
  const totalOk = Math.abs(total - 100) < 0.01;

  function update(index: number, field: keyof Tier, value: string) {
    if (!tiers) return;
    const next = [...tiers];
    if (field === "payout" || field === "chancePercent") {
      (next[index] as any)[field] = Number(value);
    } else {
      (next[index] as any)[field] = value;
    }
    setTiers(next);
  }

  function addTier() {
    if (!tiers) return;
    setTiers([...tiers, { tier: `tier${tiers.length + 1}`, label: "Tier baru", payout: 0, chancePercent: 0 }]);
  }

  function removeTier(index: number) {
    if (!tiers) return;
    setTiers(tiers.filter((_, i) => i !== index));
  }

  async function save() {
    if (!tiers) return;
    setSaving(true);
    setMessage(null);
    const outcomes = tiers.map((t) => ({
      tier: t.tier,
      label: t.label,
      payout: t.payout,
      chance: t.chancePercent / 100,
    }));
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcomes }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "err", text: data.error ?? "Gagal simpan." });
    } else {
      setMessage({ type: "ok", text: "Tersimpan. Berlaku buat main selanjutnya." });
    }
  }

  if (!tiers) {
    return <p className="text-ivory/50">Memuat...</p>;
  }

  return (
    <div className="space-y-4">
      {tiers.map((t, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-lacquer2/60 border border-gold/20 rounded-lg p-3">
          <input
            className="col-span-3 bg-lacquer border border-gold/20 rounded px-2 py-1.5 text-sm"
            value={t.label}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder="Nama (mis. Kalah)"
          />
          <input
            className="col-span-2 bg-lacquer border border-gold/20 rounded px-2 py-1.5 text-sm"
            value={t.tier}
            onChange={(e) => update(i, "tier", e.target.value)}
            placeholder="id unik"
          />
          <div className="col-span-3 flex items-center gap-1">
            <span className="text-xs text-ivory/40">Payout</span>
            <input
              type="number"
              className="w-full bg-lacquer border border-gold/20 rounded px-2 py-1.5 text-sm"
              value={t.payout}
              onChange={(e) => update(i, "payout", e.target.value)}
            />
          </div>
          <div className="col-span-3 flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              className="w-full bg-lacquer border border-gold/20 rounded px-2 py-1.5 text-sm"
              value={t.chancePercent}
              onChange={(e) => update(i, "chancePercent", e.target.value)}
            />
            <span className="text-xs text-ivory/40">%</span>
          </div>
          <button onClick={() => removeTier(i)} className="col-span-1 text-ember2 text-sm hover:text-ember">
            hapus
          </button>
        </div>
      ))}

      <button onClick={addTier} className="text-sm text-gold2 hover:text-gold">
        + tambah tier
      </button>

      <div className="flex items-center justify-between pt-2 border-t border-gold/10">
        <p className={`text-sm font-semibold ${totalOk ? "text-jade2" : "text-ember2"}`}>
          Total peluang: {total.toFixed(2)}% {totalOk ? "✓" : "(harus 100%)"}
        </p>
        <button
          onClick={save}
          disabled={saving || !totalOk}
          className="px-5 py-2 rounded-lg bg-gold hover:bg-gold2 disabled:opacity-40 text-lacquer font-semibold"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-jade2" : "text-ember2"}`}>{message.text}</p>
      )}
    </div>
  );
}
