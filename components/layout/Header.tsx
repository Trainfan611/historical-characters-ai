'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sky-300 text-base sm:text-lg">✦</span>
          <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-50">
            Historical Characters
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-4 text-xs sm:text-sm">
          <Link
            href="/generate"
            className="text-slate-200 hover:text-sky-300 transition-colors"
          >
            Генерация
          </Link>
          <Link
            href="/contacts"
            className="text-slate-200 hover:text-sky-300 transition-colors"
          >
            Контакты
          </Link>

          {status === 'loading' ? (
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-slate-500 border-t-sky-400 rounded-full animate-spin" />
          ) : session ? (
            <>
              <Link
                href="/profile"
                className="text-slate-200 hover:text-sky-300 transition-colors"
              >
                Профиль
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 text-[11px] sm:text-xs bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-500 rounded-full transition-colors"
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 text-[11px] sm:text-xs bg-sky-400 text-slate-950 font-medium rounded-full hover:bg-sky-300 transition-colors"
            >
              Войти через Telegram
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
