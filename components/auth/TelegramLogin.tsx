'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Script from 'next/script';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export function TelegramLogin() {
  useEffect(() => {
    window.onTelegramAuth = async (user: any) => {
      try {
        await signIn('credentials', {
          id: user.id.toString(),
          hash: user.hash,
          username: user.username || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          photo_url: user.photo_url || '',
          auth_date: user.auth_date.toString(),
          redirect: true,
          callbackUrl: '/generate',
        });
      } catch (error) {
        console.error('Login error:', error);
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-widget.js?22"
        strategy="lazyOnload"
        data-telegram-login={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username'}
        data-size="large"
        data-onauth="onTelegramAuth(user)"
        data-request-access="write"
      />
    </>
  );
}
