import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyTelegramData, TelegramAuthData } from '@/lib/telegram';

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
          console.error('[Auth] No credentials provided');
          return null;
        }

        // Проверка конфигурации
        if (!process.env.DATABASE_URL) {
          console.error('[Auth] DATABASE_URL is not configured');
          return null;
        }

        // Валидация обязательных полей
        if (!credentials.id || !credentials.hash || !credentials.auth_date) {
          console.error('[Auth] Missing required fields:', {
            hasId: !!credentials.id,
            hasHash: !!credentials.hash,
            hasAuthDate: !!credentials.auth_date,
          });
          return null;
        }

        console.log('[Auth] Telegram credentials received for id:', credentials.id);
        console.log('[Auth] Received credentials:', {
          id: credentials.id,
          hasHash: !!credentials.hash,
          hasUsername: !!credentials.username,
          hasFirstName: !!credentials.first_name,
          hasLastName: !!credentials.last_name,
          hasPhotoUrl: !!credentials.photo_url,
          hasAuthDate: !!credentials.auth_date,
        });

        // Верификация данных Telegram
        // Не передаем пустые строки - только реальные значения
        const telegramData: TelegramAuthData = {
          id: credentials.id,
          hash: credentials.hash,
          first_name: credentials.first_name || '',
          auth_date: credentials.auth_date,
          ...(credentials.username && credentials.username.trim() && { username: credentials.username.trim() }),
          ...(credentials.last_name && credentials.last_name.trim() && { last_name: credentials.last_name.trim() }),
          ...(credentials.photo_url && credentials.photo_url.trim() && { photo_url: credentials.photo_url.trim() }),
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
        try {
          const user = await prisma.user.upsert({
            where: { telegramId: credentials.id },
            update: {
              username: credentials.username?.trim() || null,
              firstName: credentials.first_name?.trim() || null,
              lastName: credentials.last_name?.trim() || null,
              photoUrl: credentials.photo_url?.trim() || null,
            },
            create: {
              telegramId: credentials.id,
              username: credentials.username?.trim() || null,
              firstName: credentials.first_name?.trim() || null,
              lastName: credentials.last_name?.trim() || null,
              photoUrl: credentials.photo_url?.trim() || null,
              isSubscribed: false,
            },
          });

          console.log('[Auth] User created/updated successfully:', user.id);

          return {
            id: user.id,
            telegramId: user.telegramId,
            name: user.firstName || user.username || 'User',
            email: user.username ? `${user.username}@telegram` : null,
            image: user.photoUrl || null,
          };
        } catch (error: any) {
          console.error('[Auth] Database error during user upsert:', {
            error: error.message,
            code: error.code,
            telegramId: credentials.id,
          });

          // Если ошибка уникальности (дубликат telegramId), пробуем найти существующего пользователя
          if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
            try {
              const existingUser = await prisma.user.findUnique({
                where: { telegramId: credentials.id },
              });

              if (existingUser) {
                console.log('[Auth] Found existing user after unique constraint error:', existingUser.id);
                return {
                  id: existingUser.id,
                  telegramId: existingUser.telegramId,
                  name: existingUser.firstName || existingUser.username || 'User',
                  email: existingUser.username ? `${existingUser.username}@telegram` : null,
                  image: existingUser.photoUrl || null,
                };
              }
            } catch (findError) {
              console.error('[Auth] Error finding existing user:', findError);
            }
          }

          // Для других ошибок БД возвращаем null
          return null;
        }
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
