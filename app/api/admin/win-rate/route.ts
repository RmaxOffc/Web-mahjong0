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
    const { userId, maxBigWin } = await req.json();
    
    if (!userId || maxBigWin === undefined || !Number.isInteger(maxBigWin) || maxBigWin < 0) {
      return NextResponse.json({ error: 'Invalid data - maxBigWin harus angka >= 0' }, { status: 400 });
    }

    // Cari admin user
    const admin = await prisma.user.findUnique({
      where: { discordId }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Cari target user
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

    // Upsert UserSetting dengan transaction
    const oldSetting = await prisma.userSetting.findUnique({
      where: { userId: user.id }
    });

    const updatedSetting = await prisma.$transaction(async (tx) => {
      const setting = await tx.userSetting.upsert({
        where: { userId: user.id },
        update: { 
          maxBigWin: maxBigWin,
          currentWin: 0 // reset counter
        },
        create: {
          userId: user.id,
          maxBigWin: maxBigWin,
          winStreak: 0,
          currentWin: 0
        }
      });

      // Catat aksi di AdminCoinAction
      await tx.adminCoinAction.create({
        data: {
          adminId: admin.id,
          targetUserId: user.id,
          actionType: 'SET_WIN_RATE',
          oldValue: oldSetting
  ? { maxBigWin: oldSetting.maxBigWin, currentWin: oldSetting.currentWin }
  : undefined,
          newValue: { maxBigWin: setting.maxBigWin, currentWin: setting.currentWin }
        }
      });

      return setting;
    });

    return NextResponse.json({ 
      success: true, 
      message: `✅ Set win rate untuk ${user.username}: ${maxBigWin}x big win (counter direset)`,
      data: {
        userId: user.id,
        username: user.username,
        maxBigWin: updatedSetting.maxBigWin,
        currentWin: updatedSetting.currentWin
      }
    });
  } catch (error) {
    console.error('Set win rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
