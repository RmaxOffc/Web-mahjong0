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
    const { userId, cardType = 'empty' } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
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

    // Data kartu berdasarkan tipe
    const cardData = {
      type: cardType,
      isEmpty: cardType === 'empty',
      timestamp: new Date().toISOString()
    };

    const oldSetting = await prisma.userSetting.findUnique({
      where: { userId: user.id }
    });

    // Upsert UserSetting dengan custom card
    const updatedSetting = await prisma.$transaction(async (tx) => {
      const setting = await tx.userSetting.upsert({
        where: { userId: user.id },
        update: { 
          cardCustomization: cardData
        },
        create: {
          userId: user.id,
          maxBigWin: 1,
          winStreak: 0,
          currentWin: 0,
          cardCustomization: cardData
        }
      });

      // Catat aksi di AdminCoinAction
      await tx.adminCoinAction.create({
        data: {
          adminId: admin.id,
          targetUserId: user.id,
          actionType: 'SET_CUSTOM_CARD',
          oldValue: oldSetting?.cardCustomization ?? undefined,
          newValue: cardData
        }
      });

      return setting;
    });

    return NextResponse.json({ 
      success: true, 
      message: `✅ Set custom card untuk ${user.username} - Kartu Kosong (no symbols)`,
      data: {
        userId: user.id,
        username: user.username,
        cardType: cardType,
        customization: updatedSetting.cardCustomization
      }
    });
  } catch (error) {
    console.error('Set custom card error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
