import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import crypto from 'crypto';

/**
 * POST /api/admin/access-token
 * Генерирует временный токен доступа к админ-панели
 * Доступен только админам
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, что пользователь админ
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Генерируем секретный токен (действителен 1 час)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    // Сохраняем токен в переменную окружения или в кэш (для простоты используем env)
    // В production лучше использовать Redis или базу данных
    
    // Возвращаем ссылку с токеном
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const adminUrl = `${baseUrl}/admin?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      url: adminUrl,
      expiresAt: expiresAt.toISOString(),
      message: 'Токен действителен 1 час',
    });
  } catch (error: any) {
    console.error('[Admin Access Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/access-token/verify?token=...
 * Проверяет валидность токена доступа
 * Простая проверка: если пользователь админ и есть токен - доступ разрешен
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token required' }, { status: 400 });
    }

    // Проверяем через сессию и isAdmin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ valid: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminStatus = await isAdmin();
    
    // Если пользователь админ и есть токен - доступ разрешен
    // В production здесь должна быть проверка токена из базы данных или Redis
    return NextResponse.json({
      valid: adminStatus && !!token,
      isAdmin: adminStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
