import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4 seal-stamp text-ember select-none">麻將</div>
      <h1 className="font-display text-4xl sm:text-5xl font-black gold-text mb-3">Mahjong Coin</h1>
      <p className="text-ivory/70 max-w-md mb-8">
        Tarik ubin, kumpulkan koin. Main langsung dari web atau lewat bot Discord —
        saldo kamu selalu sama di mana pun kamu main.
      </p>
      <SignInButton />
      <p className="mt-6 text-xs text-ivory/40 max-w-sm">
        Koin di sini murni data, bukan uang asli dan tidak bisa ditukar uang asli.
      </p>
    </main>
  );
}
