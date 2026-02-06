'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import axios from 'axios';

interface Generation {
  id: string;
  personName: string;
  imageUrl: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isSubscribed: boolean;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchGenerations();
      checkSubscription();
    }
  }, [status, router]);

  const fetchGenerations = async () => {
    try {
      const response = await axios.get('/api/generations');
      setGenerations(response.data.generations || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const response = await axios.get('/api/subscription/check');
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const deleteGeneration = async (id: string) => {
    if (!confirm('Удалить эту генерацию?')) return;

    try {
      await axios.delete(`/api/generations/${id}`);
      setGenerations(generations.filter((g) => g.id !== id));
    } catch (error) {
      console.error('Error deleting generation:', error);
      alert('Ошибка при удалении');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Профиль</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Пользователь</h2>
            <p className="text-gray-600">
              {session.user?.name || 'Пользователь'}
            </p>
            {session.user?.email && (
              <p className="text-sm text-gray-500 mt-1">{session.user.email}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Генераций</h2>
            <p className="text-3xl font-bold text-blue-600">{generations.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Подписка Free</h2>
            <p className={`font-semibold ${subscriptionStatus?.isSubscribed ? 'text-green-600' : 'text-red-600'}`}>
              {subscriptionStatus?.isSubscribed ? 'Активна' : 'Не активна'}
            </p>
            {!subscriptionStatus?.isSubscribed && (
              <button
                onClick={checkSubscription}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Проверить подписку
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">История генераций</h2>
          
          {generations.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              У вас пока нет генераций. <a href="/generate" className="text-blue-600 hover:underline">Создайте первую!</a>
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {generations.map((generation) => (
                <div key={generation.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={generation.imageUrl}
                    alt={generation.personName}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{generation.personName}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {new Date(generation.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={generation.imageUrl}
                        download
                        className="flex-1 text-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Скачать
                      </a>
                      <button
                        onClick={() => deleteGeneration(generation.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
