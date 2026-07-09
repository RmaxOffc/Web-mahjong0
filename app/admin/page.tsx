import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminDiscordId } from "@/lib/admin";
import AdminConfigForm from "@/components/AdminConfigForm";
import AdminControlPanel from "@/components/AdminControlPanel";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as any)?.discordId;
  if (!discordId) redirect("/");
  if (!isAdminDiscordId(discordId)) redirect("/dashboard");

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* ===== HEADER ===== */}
        <h1 className="font-display text-3xl font-bold gold-text mb-1">🛡️ Admin Control Panel</h1>
        <p className="text-ivory/60 text-sm mb-8">Kelola user, coin, win rate, dan custom kartu</p>

        {/* ===== NEW CONTROL PANEL ===== */}
        <AdminControlPanel />

        {/* ===== PEMISAH ===== */}
        <hr className="my-10 border-ivory/20" />

        {/* ===== BAGIAN GAME CONFIG ===== */}
        <h2 className="font-display text-3xl font-bold gold-text mb-2">Atur Peluang & Payout</h2>
        <p className="text-ivory/60 text-sm mb-8">
          Total peluang semua tier harus persis 100%. Perubahan langsung dipakai bot Discord juga
          (cache di-refresh otomatis, maksimal delay ~15 detik).
        </p>
        <AdminConfigForm />


      </div>
    </main>
  );
}
