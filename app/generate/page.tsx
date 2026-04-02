'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [channelLink, setChannelLink] = useState<string | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [generationLimit, setGenerationLimit] = useState<{
    limit: number;
    used: number;
    remaining: number;
    isLimitReached: boolean;
    plan?: string | null;
    planName?: string | null;
    priceRubPerMonth?: number | null;
    contactForCustom?: string | null;
  } | null>(null);
  const [plansData, setPlansData] = useState<{
    contactForCustom: string;
  } | null>(null);
  const [isSendingPlanRequest, setIsSendingPlanRequest] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      checkSubscription();
      fetchChannelLink();
      fetchGenerationLimit();
      fetchPlans();
    }
  }, [status, router]);

  const fetchChannelLink = async () => {
    try {
      const response = await axios.get('/api/subscription/channel');
      if (response.data.channelLink) {
        setChannelLink(response.data.channelLink);
      }
    } catch (error) {
      console.error('Error fetching channel link:', error);
    }
  };

  const fetchGenerationLimit = async () => {
    try {
      const response = await axios.get('/api/generations/limit');
      setGenerationLimit(response.data);
    } catch (error) {
      console.error('Error fetching generation limit:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/subscription/plans');
      setPlansData({
        contactForCustom: response.data.contactForCustom || '@Martynov_DA',
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const requestPlan = async (requestedPlan: 'pro100' | 'custom') => {
    setIsSendingPlanRequest(true);
    try {
      const response = await axios.post('/api/subscription/request', { requestedPlan });
      const contact = response.data.contactForCustom || plansData?.contactForCustom || '@Martynov_DA';
      setError(`Заявка отправлена. Мы свяжемся с вами в Telegram. Для ускорения можно написать ${contact}`);
    } catch (error: any) {
      const details = error.response?.data?.details || error.response?.data?.error;
      setError(details || 'Не удалось отправить заявку на подписку. Попробуйте ещё раз.');
    } finally {
      setIsSendingPlanRequest(false);
    }
  };

  const checkSubscription = async () => {
    setIsCheckingSubscription(true);
    setError(null);
    try {
      // Используем POST для реальной проверки через Telegram API
      const response = await axios.post('/api/subscription/check');
      
      if (response.data.isSubscribed) {
        setError(null); // Очищаем ошибку при успешной подписке
        // Обновляем статус подписки
        setSubscriptionStatus({ isSubscribed: true, needsRecheck: false });
      } else {
        setError('Необходимо подписаться на канал для генерации изображений. Подпишитесь на канал и нажмите «Проверить подписку» ещё раз.');
        setSubscriptionStatus({ isSubscribed: false, needsRecheck: false });
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Не удалось проверить подписку. Попробуйте ещё раз.';
      setError(errorMessage);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const searchPersons = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce: ждем 300ms перед запросом
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Используем новый endpoint для автодополнения с конкретными подсказками
        const response = await axios.get(
          `/api/persons/autocomplete?q=${encodeURIComponent(query)}&limit=5`
        );
        
        // Преобразуем подсказки в формат для отображения
        const suggestions = (response.data.suggestions || []).map((suggestion: any) => ({
          id: suggestion.name,
          name: suggestion.displayName || suggestion.name,
          era: suggestion.era,
          originalName: suggestion.name, // Сохраняем оригинальное имя для генерации
        }));
        
        setSearchResults(suggestions);
      } catch (error) {
        console.error('Error searching persons:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        setError(null); // Очищаем ошибку при успехе
        // Обновляем лимит после успешной генерации
        fetchGenerationLimit();
      } else {
        setError(response.data.error || 'Не удалось сгенерировать изображение');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      
      if (error.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        setError('Необходимо подписаться на канал. Проверьте подписку и попробуйте снова.');
        checkSubscription();
      } else if (error.response?.data?.code === 'DAILY_LIMIT_REACHED') {
        setError(`Достигнут дневной лимит генераций (${error.response.data.limit}/день). Лимит обновится завтра.`);
        fetchGenerationLimit(); // Обновляем лимит
      } else {
        // Показываем детальную информацию об ошибке
        const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Ошибка при генерации изображения';
        const details = error.response?.data?.details;
        
        // Формируем понятное сообщение для пользователя
        let userMessage = errorMessage;
        
        // Переводим технические ошибки на понятный язык
        if (errorMessage.includes('PERPLEXITY_API_KEY')) {
          userMessage = 'Ошибка поиска информации. Проверьте настройки API.';
        } else if (errorMessage.includes('OPENAI_API_KEY')) {
          userMessage = 'Ошибка генерации промпта. Проверьте настройки API.';
        } else if (errorMessage.includes('REPLICATE_API_KEY')) {
          userMessage = 'Ошибка генерации изображения. Проверьте настройки API.';
        } else if (errorMessage.includes('Failed to find information')) {
          userMessage = `Не удалось найти информацию о "${personName.trim()}". Попробуйте указать полное имя (например, "Владимир Путин" вместо "Путин").`;
        } else if (errorMessage.includes('Failed to generate image')) {
          userMessage = 'Не удалось сгенерировать изображение. Попробуйте ещё раз или проверьте настройки.';
        }
        
        setError(userMessage);
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

        {/* Индикатор лимита генераций */}
        {subscriptionStatus?.isSubscribed && generationLimit && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-3xl bg-amber-900/20 border border-amber-500/40 rounded-xl px-6 py-3 flex items-center justify-center gap-2 text-center">
              <span className="text-amber-200 text-lg">✦</span>
              <span className="text-amber-100 text-sm">
                {generationLimit.remaining} из {generationLimit.limit} генераций сегодня
              </span>
              {generationLimit.planName && (
                <span className="text-amber-300 text-xs ml-2">
                  (тариф: {generationLimit.planName})
                </span>
              )}
              {generationLimit.isLimitReached && (
                <span className="text-amber-300 text-xs ml-2">
                  (Лимит обновится завтра)
                </span>
              )}
            </div>
          </div>
        )}

        {subscriptionStatus?.isSubscribed && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-3xl bg-sky-900/20 border border-sky-500/40 rounded-xl px-6 py-4 text-center">
              <p className="text-sky-100 text-sm">
                Подписка для увеличения лимита: <strong>100 генераций/день за 599 ₽</strong>
              </p>
              <p className="text-sky-200/80 text-xs mt-1">
                Нужен лимит выше 100/день? Подключим индивидуально по запросу.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => requestPlan('pro100')}
                  disabled={isSendingPlanRequest}
                  className="px-4 py-2 text-xs rounded-full bg-sky-400 text-slate-950 font-semibold hover:bg-sky-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Подключить 100/день за 599 ₽
                </button>
                <button
                  type="button"
                  onClick={() => requestPlan('custom')}
                  disabled={isSendingPlanRequest}
                  className="px-4 py-2 text-xs rounded-full bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Больше генераций — по запросу
                </button>
              </div>
              <p className="text-slate-400 text-xs mt-2">
                Контакт: {generationLimit?.contactForCustom || plansData?.contactForCustom || '@Martynov_DA'}
              </p>
            </div>
          </div>
        )}

        {!subscriptionStatus?.isSubscribed && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-3xl bg-amber-900/20 border border-amber-500/40 rounded-xl px-6 py-4 flex flex-col items-center gap-3 text-center">
              <p className="text-amber-100 text-sm">
                Для генерации изображений необходимо подписаться на наш Telegram канал
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {channelLink ? (
                  <a
                    href={channelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 text-xs sm:text-sm rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors cursor-pointer order-1"
                  >
                    Подписаться на канал
                  </a>
                ) : (
                  <div className="px-5 py-2 text-xs sm:text-sm rounded-full bg-blue-500/50 text-white/50 font-medium cursor-not-allowed order-1">
                    Подписаться на канал
                  </div>
                )}
                <button
                  type="button"
                  onClick={checkSubscription}
                  disabled={isCheckingSubscription}
                  className="px-5 py-2 text-xs sm:text-sm rounded-full bg-amber-400 text-slate-950 font-medium hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed transition-colors cursor-pointer order-2 flex items-center gap-2"
                >
                  {isCheckingSubscription ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    'Проверить подписку'
                  )}
                </button>
              </div>
            </div>
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
              💡 Можете ввести любое имя исторической личности - система вам его сгенерирует
            </p>

            {isSearching && (
              <div className="mt-2 text-xs text-slate-500">Поиск...</div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-3 border border-slate-700 rounded-xl max-h-52 overflow-y-auto bg-slate-950/90 shadow-lg">
                {searchResults.map((person: any) => (
                  <button
                    key={person.id}
                    onClick={() => {
                      // Используем оригинальное имя для генерации, но показываем красивое отображение
                      setPersonName(person.originalName || person.name);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-900/80 hover:border-l-2 hover:border-l-sky-400 border-b border-slate-800 last:border-b-0 text-sm transition-all"
                  >
                    <div className="font-medium text-slate-50">{person.name}</div>
                    {person.era && (
                      <div className="text-xs text-slate-400 mt-0.5">{person.era}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !subscriptionStatus?.isSubscribed || (generationLimit?.isLimitReached ?? false)}
              className="mt-4 w-full px-6 py-3 rounded-full bg-sky-400 text-slate-950 font-semibold text-sm hover:bg-sky-300 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Генерация...' : 'Сгенерировать изображение'}
            </button>
            
            {generationLimit?.isLimitReached && (
              <p className="mt-2 text-xs text-amber-400 text-center">
                Лимит помогает сервису оставаться бесплатным для всех
              </p>
            )}

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
                <div className="flex gap-3">
                  <a
                    href={generatedImage}
                    download
                    className="flex-1 inline-flex items-center justify-center px-6 py-2 text-sm rounded-full bg-sky-400 text-slate-950 font-semibold hover:bg-sky-300 transition-colors"
                  >
                    Скачать изображение
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        // Пробуем использовать Web Share API
                        if (navigator.share && navigator.canShare) {
                          // Для шаринга изображения нужно сначала получить файл
                          const response = await fetch(generatedImage);
                          const blob = await response.blob();
                          const file = new File([blob], 'historical-character.png', { type: 'image/png' });
                          
                          if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              files: [file],
                              title: `Историческая личность: ${personName || 'Генерация'}`,
                              text: 'Посмотрите, как выглядела эта историческая личность!',
                            });
                            setError(null);
                            return;
                          }
                        }
                        
                        // Fallback: копируем ссылку в буфер обмена
                        await navigator.clipboard.writeText(generatedImage);
                        setError('Ссылка на изображение скопирована в буфер обмена!');
                        setTimeout(() => setError(null), 3000);
                      } catch (error: any) {
                        if (error.name !== 'AbortError') {
                          console.error('Error sharing:', error);
                          // Пробуем скопировать ссылку
                          try {
                            await navigator.clipboard.writeText(generatedImage);
                            setError('Ссылка на изображение скопирована в буфер обмена!');
                            setTimeout(() => setError(null), 3000);
                          } catch (clipboardError) {
                            setError('Не удалось поделиться изображением');
                            setTimeout(() => setError(null), 3000);
                          }
                        }
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center px-6 py-2 text-sm rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors"
                  >
                    Поделиться
                  </button>
                </div>
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
