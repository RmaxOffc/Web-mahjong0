import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MahjongBoard from "@/components/MahjongBoard";
import Navbar from "@/components/Navbar";
import TransferForm from "@/components/TransferForm";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as any)?.discordId;
  if (!discordId) redirect("/");

  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) redirect("/");

  return (
    <main className="min-h-screen px-4 py-8">
  <Navbar username={user.username} avatar={user.avatar} />
  <div className="mt-10">
    <MahjongBoard initialBalance={Number(user.balance)} />
  </div>
  <div className="mt-6">
    <TransferForm />
  </div>
</main>
  );
}
