"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

export default function Navbar({ username, avatar }: { username: string; avatar?: string | null }) {
  return (
    <nav className="max-w-xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        {avatar && (
          <Image src={avatar} alt={username} width={36} height={36} className="rounded-full border border-gold/40" />
        )}
        <div>
          <p className="text-sm text-ivory/50">Selamat datang,</p>
          <p className="font-display font-bold text-gold2">{username}</p>
        </div>
      </div>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-ivory/50 hover:text-ivory">
        Keluar
      </button>
    </nav>
  );
}
