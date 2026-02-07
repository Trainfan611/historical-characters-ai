'use client';

import { useEffect, useState } from 'react';
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

  // Загружаем реальные изображения из API
  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch('/api/generations/public?limit=12');
        if (response.ok) {
          const data = await response.json();
          if (data.generations && data.generations.length > 0) {
            setImages(data.generations);
          }
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchImages();
  }, []);

  // Автоматическая прокрутка слева направо
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        // Плавно переходим к следующему изображению
        const nextIndex = (prevIndex + 1) % images.length;
        return nextIndex;
      });
    }, 3000); // Меняем изображение каждые 3 секунды

    return () => clearInterval(interval);
  }, [images.length]);

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

  // Показываем 3 изображения одновременно
  const visibleCount = 3;
  const duplicatedImages = [...images, ...images, ...images]; // Для бесшовной прокрутки

  return (
    <div className="relative w-full overflow-hidden mt-8 max-w-4xl mx-auto">
      <div 
        className="relative w-full"
        style={{ aspectRatio: '16/9', height: '100%' }}
      >
        <div
          className="flex transition-transform duration-1000 ease-in-out absolute inset-0 h-full"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            width: `${(duplicatedImages.length / visibleCount) * 100}%`,
          }}
        >
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              className="flex-shrink-0 px-1.5 h-full overflow-hidden"
              style={{ width: `${100 / visibleCount}%` }}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-800/80 bg-slate-900/60 shadow-md">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="!object-cover !object-center"
                  style={{ 
                    objectFit: 'cover',
                    objectPosition: 'center',
                    minWidth: '100%',
                    minHeight: '100%',
                    width: '100%',
                    height: '100%',
                  }}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized
                  priority={index < visibleCount}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-2">
                  <p className="text-xs text-slate-200 font-medium truncate">
                    {image.alt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Индикаторы */}
      <div className="flex justify-center gap-1.5 mt-2">
        {images.slice(0, Math.min(images.length, 10)).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? 'w-6 bg-sky-400'
                : 'w-1.5 bg-slate-600 hover:bg-slate-500'
            }`}
            aria-label={`Перейти к изображению ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
