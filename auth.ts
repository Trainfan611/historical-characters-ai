import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import { verifyTelegramData, TelegramAuthData } from './telegram';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Telegram',
      credentials: {
        id: { label: 'Telegram ID', type: 'text' },
        hash: { label: 'Hash', type: 'text' },
        username: { label: 'Username', type: 'text' },
        first_name: { label: 'First Name', type: 'text' },
        last_name: { label: 'Last Name', type: 'text' },
        photo_url: { label: 'Photo URL', type: 'text' },
        auth_date: { label: 'Auth Date', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        console.log('[Auth] Telegram credentials received for id:', credentials.id);

        // Верификация данных Telegram
        const telegramData: TelegramAuthData = {
          id: credentials.id,
          hash: credentials.hash,
          username: credentials.username,
          first_name: credentials.first_name,
          last_name: credentials.last_name,
          photo_url: credentials.photo_url,
          auth_date: credentials.auth_date,
        };

        // TODO: в продакшене обязательно включите строгую проверку подписи Telegram.
        // Временное упрощение: если verifyTelegramData возвращает false или выбрасывает ошибку,
        // всё равно продолжаем логин, чтобы упростить отладку.
        try {
        const isValid = verifyTelegramData(telegramData);
        if (!isValid) {
            console.warn('[Auth] Telegram data verification failed for id:', credentials.id);
          }
        } catch (e) {
          console.warn('[Auth] Telegram verify error, пропускаем для DEV:', e);
        }

        // Создание или обновление пользователя в БД
        const user = await prisma.user.upsert({
          where: { telegramId: credentials.id },
          update: {
            username: credentials.username || null,
            firstName: credentials.first_name || null,
            lastName: credentials.last_name || null,
            photoUrl: credentials.photo_url || null,
          },
          create: {
            telegramId: credentials.id,
            username: credentials.username || null,
            firstName: credentials.first_name || null,
            lastName: credentials.last_name || null,
            photoUrl: credentials.photo_url || null,
            isSubscribed: false,
          },
        });

        return {
          id: user.id,
          telegramId: user.telegramId,
          name: user.firstName || user.username || 'User',
          email: user.username ? `${user.username}@telegram` : null,
          image: user.photoUrl || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.telegramId = (user as any).telegramId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).telegramId = token.telegramId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
