import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { isAdminDiscordId } from '@/lib/admin';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as any)?.discordId;
  
  if (!discordId || !isAdminDiscordId(discordId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId, amount } = await req.json();
    
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const amountBig = BigInt(amount);

    // Cari admin user berdasarkan discordId
    const admin = await prisma.user.findUnique({
      where: { discordId }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Cari target user berdasarkan discordId atau id
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { discordId: userId },
          { id: userId }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldBalance = user.balance;

    // Update balance dengan transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amountBig } }
      });

      // Catat aksi di AdminCoinAction
      await tx.adminCoinAction.create({
        data: {
          adminId: admin.id,
          targetUserId: user.id,
          actionType: 'TOPUP',
          amount: amountBig,
          oldValue: { balance: oldBalance.toString() },
          newValue: { balance: updated.balance.toString() }
        }
      });

      return updated;
    });

    return NextResponse.json({ 
      success: true, 
      message: `✅ Berhasil topup ${amount} coin untuk user ${user.username}`,
      data: {
        userId: user.id,
        username: user.username,
        oldBalance: oldBalance.toString(),
        newBalance: updatedUser.balance.toString()
      }
    });
  } catch (error) {
    console.error('Topup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
