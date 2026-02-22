'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TelegramLogin } from '@/components/auth/TelegramLogin';

function ChangeAccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ 
        callbackUrl: '/change-account',
        redirect: false 
      });
      // После выхода показываем форму входа
      setShowLogin(true);
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Ошибка при выходе. Попробуйте еще раз.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Показываем загрузку, пока проверяем сессию
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-500 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Если пользователь не авторизован и не показываем форму входа, перенаправляем
  if (!session && !showLogin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-8">
          {session && !showLogin ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-slate-50">
                Смена аккаунта Telegram
              </h1>
              
              <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Текущий аккаунт:</p>
                <div className="flex items-center gap-3">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-slate-50 font-medium">
                      {session.user?.name || 'Пользователь'}
                    </p>
                    {session.user?.email && (
                      <p className="text-sm text-slate-400">{session.user.email}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3 bg-sky-500 text-slate-950 font-medium rounded-lg hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? 'Выход...' : 'Выйти и войти с другим аккаунтом'}
                </button>
                
                <Link
                  href="/profile"
                  className="block w-full text-center px-4 py-3 bg-slate-800 text-slate-200 font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Отмена
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-slate-50">
                Вход через Telegram
              </h1>
              <p className="text-slate-400 text-center mb-8">
                Войдите с новым аккаунтом Telegram для продолжения
              </p>

              <div id="telegram-login" className="mt-6 flex justify-center">
                <TelegramLogin />
              </div>

              <p className="text-xs text-slate-500 text-center mt-4">
                Нажимая кнопку, вы соглашаетесь с{' '}
                <Link 
                  href="/terms" 
                  className="text-sky-400 hover:text-sky-300 underline transition-colors"
                >
                  условиями использования
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ChangeAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-500 border-t-sky-400 rounded-full animate-spin" />
      </div>
    }>
      <ChangeAccountContent />
    </Suspense>
  );
}
