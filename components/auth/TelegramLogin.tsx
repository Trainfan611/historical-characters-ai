'use client';

import { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export function TelegramLogin() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.onTelegramAuth = async (user: any) => {
      try {
        // Валидация данных от Telegram
        if (!user || !user.id || !user.hash || !user.auth_date) {
          console.error('[TelegramLogin] Invalid user data from Telegram:', user);
          alert('Ошибка: неполные данные от Telegram. Попробуйте еще раз.');
          return;
        }

        console.log('[TelegramLogin] Processing Telegram auth for user:', user.id);

        // Передаем только валидные данные, пустые строки заменяем на undefined
        const credentials: Record<string, string> = {
          id: user.id.toString(),
          hash: user.hash,
          auth_date: user.auth_date.toString(),
        };

        // Добавляем опциональные поля только если они есть
        if (user.username) credentials.username = user.username;
        if (user.first_name) credentials.first_name = user.first_name;
        if (user.last_name) credentials.last_name = user.last_name;
        if (user.photo_url) credentials.photo_url = user.photo_url;

        const result = await signIn('credentials', {
          ...credentials,
          redirect: false,
          callbackUrl: '/generate',
        });

        if (result?.error) {
          console.error('[TelegramLogin] Login error:', result.error);
          
          // Более информативные сообщения об ошибках
          let errorMessage = 'Ошибка входа. Попробуйте еще раз.';
          if (result.error === 'CredentialsSignin') {
            errorMessage = 'Ошибка авторизации. Проверьте данные и попробуйте снова.';
          } else if (result.error.includes('database') || result.error.includes('Database')) {
            errorMessage = 'Ошибка подключения к базе данных. Попробуйте позже.';
          }
          
          alert(errorMessage);
          return;
        }

        // Успешный логин — используем полную перезагрузку для гарантированного обновления сессии
        if (result?.ok !== false) {
          console.log('[TelegramLogin] Login successful, redirecting to /generate');
          // Используем window.location для полной перезагрузки и обновления сессии
          window.location.href = '/generate';
        } else {
          console.warn('[TelegramLogin] Login result is not OK:', result);
          alert('Ошибка входа. Попробуйте еще раз.');
        }
      } catch (error: any) {
        console.error('[TelegramLogin] Login error:', error);
        
        // Более информативные сообщения об ошибках
        let errorMessage = 'Ошибка входа. Попробуйте еще раз.';
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
        } else if (error.message?.includes('database') || error.message?.includes('Database')) {
          errorMessage = 'Ошибка подключения к базе данных. Попробуйте позже.';
        }
        
        alert(errorMessage);
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
  }, []);

  return <div ref={containerRef} />;
}
