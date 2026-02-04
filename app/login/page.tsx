'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TelegramLogin } from '@/components/auth/TelegramLogin';

export default function LoginPage() {
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

          <p className="text-sm text-gray-500 text-center mt-4">
            Нажимая кнопку, вы соглашаетесь с условиями использования
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
