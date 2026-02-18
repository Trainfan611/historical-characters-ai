'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TelegramLogin } from '@/components/auth/TelegramLogin';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Если пользователь уже авторизован, перенаправляем на страницу генерации
    if (status === 'authenticated' && session) {
      router.push('/generate');
    }
  }, [status, session, router]);

  // Показываем загрузку, пока проверяем сессию
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Если пользователь уже авторизован, не показываем страницу входа
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            Вход через Telegram
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Для использования платформы необходимо войти через Telegram
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
