'use client';

import { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export function TelegramLogin() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    window.onTelegramAuth = async (user: any) => {
      try {
        const result = await signIn('credentials', {
          id: user.id.toString(),
          hash: user.hash,
          username: user.username || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          photo_url: user.photo_url || '',
          auth_date: user.auth_date.toString(),
          redirect: false,
          callbackUrl: '/generate',
        });

        if (result?.error) {
          console.error('Login error:', result.error);
          return;
        }

        // Успешный логин — сразу отправляем на страницу генерации
        router.push('/generate');
      } catch (error) {
        console.error('Login error:', error);
      }
    };

    if (!containerRef.current) return;

    // Очищаем контейнер и встраиваем виджет именно сюда
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute(
      'data-telegram-login',
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username'
    );
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [router]);

  return <div ref={containerRef} />;
}
