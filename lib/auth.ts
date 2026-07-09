import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "discord" || !profile) return true;
      const discordProfile = profile as { id: string; username?: string; avatar?: string };

      await prisma.user.upsert({
        where: { discordId: discordProfile.id },
        update: {
          username: user.name ?? discordProfile.username ?? "unknown",
          avatar: user.image ?? undefined,
        },
        create: {
          discordId: discordProfile.id,
          username: user.name ?? discordProfile.username ?? "unknown",
          avatar: user.image ?? undefined,
          balance: 1000, // saldo awal gratis buat akun baru
        },
      });
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        (session.user as any).discordId = token.sub;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (profile) {
        token.sub = (profile as any).id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};
