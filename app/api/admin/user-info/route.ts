import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { isAdminDiscordId } from '@/lib/admin';

// GET /api/admin/user-info?userId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as any)?.discordId;
  
  if (!discordId || !isAdminDiscordId(discordId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    // Cari user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { discordId: userId },
          { id: userId }
        ]
      },
      include: {
        settings: true,
        receivedCoinActions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { admin: { select: { username: true, discordId: true } } }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        balance: user.balance.toString(),
        createdAt: user.createdAt,
        settings: user.settings || null,
        recentActions: user.receivedCoinActions
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
