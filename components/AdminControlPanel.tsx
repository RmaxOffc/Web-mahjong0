"use client";

import { useState, useEffect } from "react";
import PlayerWinRateModal from "./PlayerWinRateModal";

interface UserInfo {
  id: string;
  username: string;
  balance: string;
  settings: any;
}

interface Player {
  id: string;
  username: string;
  balance: number;
  maxBigWin: number;
}

export default function AdminControlPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showWinRateModal, setShowWinRateModal] = useState(false);
  
  // Form states
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");

  const showMessage = (text: string, isError = false) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  // Fetch user info
  const fetchUserInfo = async () => {
    if (!userId.trim()) {
      showMessage("⚠️ Input User ID dulu", true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user-info?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      
      if (!res.ok) {
        showMessage(`❌ ${data.error}`, true);
        return;
      }

      setUserInfo(data.user);
      showMessage(`✅ User ditemukan: ${data.user.username}`);
    } catch (err) {
      showMessage(`❌ Error: ${err}`, true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (res.ok && data.users) {
          setPlayers(data.users.map((u: any) => ({
            id: u.id,
            username: u.username,
            balance: u.balance,
            maxBigWin: u.settings?.maxBigWin ?? 0
          })));
        }
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Topup coin
  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo) {
      showMessage("⚠️ Fetch user info dulu", true);
      return;
    }
    if (!amount || parseInt(amount) <= 0) {
      showMessage("⚠️ Amount harus > 0", true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userInfo.id, amount: parseInt(amount) })
      });
      const data = await res.json();
      
      if (!res.ok) {
        showMessage(`❌ ${data.error}`, true);
        return;
      }

      showMessage(data.message);
      setAmount("");
      // Refetch user info
      await fetchUserInfo();
    } catch (err) {
      showMessage(`❌ Error: ${err}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWinRateModal = (player: Player) => {
    setSelectedPlayer(player);
    setShowWinRateModal(true);
  };

  const handleWinRateModalClose = () => {
    setShowWinRateModal(false);
    setSelectedPlayer(null);
  };

  return (
    <div className="bg-white/5 border border-ivory/20 rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold gold-text mb-4">🎮 Advanced User Control Panel</h2>
      
      {/* Message Alert */}
      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${message.includes("❌") ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>
          {message}
        </div>
      )}

      {/* Tabs - User Search vs Players List */}
      <div className="mb-6 border-b border-ivory/20">
        <div className="flex gap-4">
          <button className="pb-3 text-ivory/80 border-b-2 border-gold font-semibold">
            🔍 Cari User
          </button>
          <span className="pb-3 text-ivory/40">|</span>
          <button className="pb-3 text-ivory/40 hover:text-ivory/60">
            👥 Daftar Pemain ({players.length})
          </button>
        </div>
      </div>

      {/* User Search Section */}
      <div className="mb-8 p-4 bg-black/20 rounded-lg border border-ivory/10">
        <label className="block text-ivory/80 text-sm mb-2">🔍 Cari User (Discord ID atau User ID)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Masukkan Discord ID atau User ID..."
            className="flex-1 bg-black/30 border border-ivory/20 rounded px-4 py-2 text-ivory placeholder-ivory/40 focus:outline-none focus:border-gold/50"
            disabled={loading}
          />
          <button
            onClick={fetchUserInfo}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {/* User Info Display */}
      {userInfo && (
        <>
          <div className="mb-6 p-4 bg-gold/5 rounded-lg border border-gold/20">
            <h3 className="font-bold text-ivory mb-3">👤 User Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-sm">
                <span className="text-ivory/60">Username: </span>
                <span className="text-gold font-bold">{userInfo.username}</span>
              </div>
              <div className="text-sm">
                <span className="text-ivory/60">Balance: </span>
                <span className="text-green-400 font-bold">{userInfo.balance}</span>
              </div>
              <div className="text-sm col-span-2">
                <span className="text-ivory/60">User ID: </span>
                <span className="text-yellow-300 text-xs font-mono break-all">{userInfo.id}</span>
              </div>
              {userInfo.settings && (
                <>
                  <div className="text-sm">
                    <span className="text-ivory/60">Max Big Win: </span>
                    <span className="text-blue-300 font-bold">{userInfo.settings.maxBigWin}x</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Control Forms */}
          <div className="grid gap-4">
            {/* Topup Form */}
            <form onSubmit={handleTopup} className="p-4 bg-black/20 rounded-lg border border-yellow-500/20">
              <h4 className="text-lg font-semibold text-yellow-400 mb-3">💰 Topup Coin</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Jumlah coin..."
                  min="1"
                  className="flex-1 bg-black/30 border border-ivory/20 rounded px-3 py-2 text-ivory placeholder-ivory/40 focus:outline-none focus:border-gold/50"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Topup"}
                </button>
              </div>
            </form>

            {/* Win Rate Form */}
            <form className="p-4 bg-black/20 rounded-lg border border-green-500/20">
              <h4 className="text-lg font-semibold text-green-400 mb-3">🎯 Set Win Rate</h4>
              <button
                type="button"
                onClick={() => handleOpenWinRateModal({
                  id: userInfo.id,
                  username: userInfo.username,
                  balance: parseInt(userInfo.balance),
                  maxBigWin: userInfo.settings?.maxBigWin ?? 0
                })}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Atur Win Rate"}
              </button>
              <p className="text-ivory/40 text-xs mt-2">Atur peluang kemenangan untuk user ini</p>
            </form>

            {/* Custom Card Form */}
            <form className="p-4 bg-black/20 rounded-lg border border-purple-500/20">
              <h4 className="text-lg font-semibold text-purple-400 mb-3">🃏 Set Kartu Kosong</h4>
              <button
                type="button"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Set Kartu Kosong (No Symbols)"}
              </button>
              <p className="text-ivory/40 text-xs mt-2">Kartu user akan menjadi kosong tanpa simbol apapun</p>
            </form>
          </div>
        </>
      )}

      {/* Players List Table */}
      <div className="mt-10 pt-10 border-t border-ivory/20">
        <h3 className="text-2xl font-bold gold-text mb-4">👥 Daftar Semua Pemain</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory/20">
                <th className="text-left py-3 px-4 text-ivory/60">Username</th>
                <th className="text-right py-3 px-4 text-ivory/60">Balance</th>
                <th className="text-center py-3 px-4 text-ivory/60">Max Win</th>
                <th className="text-center py-3 px-4 text-ivory/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-ivory/40">
                    Tidak ada pemain
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id} className="border-b border-ivory/10 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span className="text-ivory">{player.username}</span>
                      <div className="text-xs text-ivory/40">{player.id.substring(0, 12)}...</div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-green-400 font-bold">{player.balance}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-blue-300">{player.maxBigWin}x</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => handleOpenWinRateModal(player)}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/40 transition"
                      >
                        Win Rate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Win Rate Modal */}
      {showWinRateModal && selectedPlayer && (
        <PlayerWinRateModal
          player={selectedPlayer}
          onClose={handleWinRateModalClose}
          onSuccess={() => {
            showMessage(`✅ Win rate ${selectedPlayer.username} berhasil diupdate`);
            handleWinRateModalClose();
          }}
        />
      )}
    </div>
  );
}
