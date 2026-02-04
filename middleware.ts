import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Проверка подписки для защищенных роутов
    if (req.nextUrl.pathname.startsWith('/generate') || 
        req.nextUrl.pathname.startsWith('/profile')) {
      // Проверка будет выполняться на уровне страницы
      // так как требуется асинхронный запрос к Telegram API
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Разрешаем доступ только авторизованным пользователям
        // для защищенных роутов
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/generate/:path*', '/profile/:path*'],
};
