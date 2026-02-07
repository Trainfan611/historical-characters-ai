'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';

interface CarouselImage {
  id: string;
  url: string;
  alt: string;
}

// Placeholder изображения на случай, если API не вернёт данные
const placeholderImages: CarouselImage[] = [
  {
    id: 'placeholder-1',
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    alt: 'Историческая личность',
  },
  {
    id: 'placeholder-2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    alt: 'Историческая личность',
  },
  {
    id: 'placeholder-3',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    alt: 'Историческая личность',
  },
  {
    id: 'placeholder-4',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    alt: 'Историческая личность',
  },
];

export function ImageCarousel() {
  const [images, setImages] = useState<CarouselImage[]>(placeholderImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const visibleCount = 1; // Всегда показываем только 1 фото

  // Загружаем реальные изображения из API
  useEffect(() => {
    let isMounted = true;

    async function fetchImages() {
      try {
        const response = await fetch('/api/generations/public?limit=3', {
          cache: 'force-cache', // Кэшируем запрос
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.generations && data.generations.length > 0) {
            setImages(data.generations);
          }
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, []);

  // Всегда показываем 3 фото, убрана адаптивность

  // Автоматическая прокрутка слева направо
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Мемоизация дублированных изображений (только необходимое количество)
  const duplicatedImages = useMemo(() => {
    if (images.length === 0) return [];
    // Дублируем только для бесшовной прокрутки (2 копии достаточно)
    return [...images, ...images];
  }, [images]);

  // Мемоизация стилей для контейнера
  const containerStyle = useMemo(() => ({
    transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
    width: `${(duplicatedImages.length / visibleCount) * 100}%`,
  }), [currentIndex, visibleCount, duplicatedImages.length]);

  // Обработчик клика по индикатору
  const handleIndicatorClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden mt-8 max-w-2xl mx-auto px-4">
      <div 
        className="relative w-full"
        style={{ 
          aspectRatio: '4/3',
          maxHeight: '200px',
          minHeight: '150px',
        }}
      >
        <div
          className="flex transition-transform duration-1000 ease-in-out absolute inset-0 h-full w-full will-change-transform"
          style={containerStyle}
        >
          {duplicatedImages.map((image, index) => {
            const isVisible = index >= currentIndex && index < currentIndex + visibleCount;
            const isFirst = index === 0;
            
            return (
              <div
                key={`${image.id}-${index}`}
                className="flex-shrink-0 h-full overflow-hidden"
                style={{ 
                  width: `${100 / visibleCount}%`,
                  paddingLeft: isFirst ? '0' : '0.375rem',
                  paddingRight: '0.375rem',
                }}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-800/80 bg-slate-900 shadow-md flex items-center justify-center">
                  <Image
                    src={image.url}
                    alt={image.alt || 'Историческая личность'}
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading={isVisible ? 'eager' : 'lazy'}
                    quality={60}
                    priority={isVisible && index < visibleCount}
                    onError={(e) => {
                      // Обработка ошибок загрузки изображений (404 и т.д.)
                      console.warn('[Carousel] Image load error:', image.url);
                      // Можно заменить на placeholder или скрыть изображение
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-2 pointer-events-none">
                    <p className="text-xs text-slate-200 font-medium truncate">
                      {image.alt || 'Историческая личность'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Индикаторы */}
      <div className="flex justify-center gap-1.5 mt-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => handleIndicatorClick(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 bg-sky-400'
                : 'w-1.5 bg-slate-600 hover:bg-slate-500'
            }`}
            aria-label={`Перейти к изображению ${index + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
