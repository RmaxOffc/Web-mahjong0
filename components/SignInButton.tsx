"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
      className="px-8 py-3 rounded-xl bg-gold hover:bg-gold2 text-lacquer font-display font-bold tracking-wide shadow-glow transition"
    >
      Masuk dengan Discord
    </button>
  );
}
