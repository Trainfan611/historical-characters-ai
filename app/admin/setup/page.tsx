'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeMeAdmin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/make-me-admin', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при назначении админа');
      }

      setSuccess(true);
      
      // Перенаправляем на админ-панель через 2 секунды
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Требуется авторизация</h1>
          <p className="text-slate-300 mb-4">Войдите через Telegram, чтобы продолжить</p>
          <Link
            href="/login"
            className="text-sky-400 hover:text-sky-300 underline"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-8 border border-slate-700">
        <h1 className="text-2xl font-bold mb-4 text-center">Настройка админ-панели</h1>
        
        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-medium">Вы успешно назначены админом!</p>
            <p className="text-slate-400 text-sm">Перенаправление на админ-панель...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-300 mb-2">
                Вы вошли как: <span className="font-medium text-slate-100">
                  {session?.user?.name || 'Пользователь'}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Telegram ID: {(session?.user as any)?.telegramId || 'не найден'}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-200">
                ⚠️ Нажмите кнопку ниже, чтобы назначить себя администратором. 
                Это действие можно выполнить только один раз.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <button
              onClick={makeMeAdmin}
              disabled={loading}
              className="w-full px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Назначение админа...
                </>
              ) : (
                'Назначить меня админом'
              )}
            </button>

            <Link
              href="/"
              className="block text-center text-sm text-slate-400 hover:text-slate-300 underline"
            >
              Вернуться на главную
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
