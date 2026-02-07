import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserSafe } from '@/lib/user-safe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await getUserSafe((session.user as any).telegramId);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: {
          userId: dbUser.id,
          status: 'completed',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          historicalPerson: {
            select: {
              id: true,
              name: true,
              era: true,
            },
          },
        },
      }),
      prisma.generation.count({
        where: {
          userId: dbUser.id,
          status: 'completed',
        },
      }),
    ]);

    return NextResponse.json({
      generations,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching generations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    );
  }
}
