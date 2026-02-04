'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import axios from 'axios';

export default function GeneratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [personName, setPersonName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isSubscribed: boolean;
    needsRecheck: boolean;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      checkSubscription();
    }
  }, [status, router]);

  const checkSubscription = async () => {
    try {
      const response = await axios.get('/api/subscription/check');
      setSubscriptionStatus(response.data);
      
      if (!response.data.isSubscribed) {
        setError('Необходимо подписаться на канал для генерации изображений');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const searchPersons = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Используем интернет-поиск по умолчанию для расширенного поиска
      const response = await axios.get(
        `/api/persons?q=${encodeURIComponent(query)}&useInternet=true&limit=10`
      );
      setSearchResults(response.data.persons || []);
      
      // Показываем подсказку если результаты из интернета
      if (response.data.fromInternet && response.data.persons.length > 0) {
        console.log('Найдено через интернет-поиск');
      }
    } catch (error) {
      console.error('Error searching persons:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!personName.trim()) {
      setError('Введите имя исторической личности');
      return;
    }

    if (!subscriptionStatus?.isSubscribed) {
      setError('Необходимо подписаться на канал');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await axios.post('/api/generate', {
        personName: personName.trim(),
        style: 'realistic',
      });

      if (response.data.success) {
        setGeneratedImage(response.data.generation.imageUrl);
      }
    } catch (error: any) {
      if (error.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        setError('Необходимо подписаться на канал. Проверьте подписку и попробуйте снова.');
        checkSubscription();
      } else {
        setError(error.response?.data?.error || 'Ошибка при генерации изображения');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (status === 'loading') {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-sky-300">
              <span className="text-base">✦</span>
              <span className="uppercase tracking-[0.25em] text-[10px] text-sky-200/80">
                Генерация образов
              </span>
              <span className="text-base">✦</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">
              Как выглядели герои истории на самом деле?
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Введите имя исторической личности, а нейросеть попробует визуализировать её
              образ, опираясь на описания из разных источников.
            </p>
          </div>

        {!subscriptionStatus?.isSubscribed && (
          <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl p-4 mb-6">
            <p className="text-amber-100 mb-2 text-sm">
              Для генерации изображений необходимо подписаться на наш Telegram канал
            </p>
            <button
              onClick={checkSubscription}
              className="px-4 py-2 text-xs rounded-full bg-amber-400 text-slate-950 font-medium hover:bg-amber-300 transition-colors"
            >
              Проверить подписку
            </button>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 mb-6 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
            <label className="block text-xs font-medium text-slate-200 mb-2 tracking-wide uppercase">
              Имя исторической личности
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => {
                setPersonName(e.target.value);
                searchPersons(e.target.value);
              }}
              placeholder="Введите имя любой исторической личности (например: Наполеон Бонапарт, Леонардо да Винчи, Цезарь)"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-transparent"
            />
            <p className="mt-2 text-xs text-slate-500">
              💡 Можете ввести любое имя исторической личности - система найдет информацию в интернете
            </p>

            {isSearching && (
              <div className="mt-2 text-xs text-slate-500">Поиск...</div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-3 border border-slate-700 rounded-xl max-h-52 overflow-y-auto bg-slate-950/90">
                {searchResults.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => {
                      setPersonName(person.name);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-900 border-b border-slate-800 last:border-b-0 text-sm"
                  >
                    <div className="font-medium text-slate-50">{person.name}</div>
                    {person.era && (
                      <div className="text-xs text-slate-500">{person.era}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !subscriptionStatus?.isSubscribed}
              className="mt-4 w-full px-6 py-3 rounded-full bg-sky-400 text-slate-950 font-semibold text-sm hover:bg-sky-300 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Генерация...' : 'Сгенерировать изображение'}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-rose-900/30 border border-rose-600/60 rounded-xl text-rose-100 text-sm">
                {error}
              </div>
            )}
          </div>

          {isGenerating && (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-slate-600 border-t-sky-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-200">Генерация изображения...</p>
              <p className="text-xs text-slate-500 mt-2">Обычно это занимает 30–60 секунд</p>
            </div>
          )}

          {generatedImage && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-50">Результат</h2>
              <div className="relative space-y-4">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full rounded-xl border border-slate-800/80"
                />
                <a
                  href={generatedImage}
                  download
                  className="inline-flex items-center justify-center px-6 py-2 text-sm rounded-full bg-sky-400 text-slate-950 font-semibold hover:bg-sky-300 transition-colors"
                >
                  Скачать изображение
                </a>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
