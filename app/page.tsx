import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ImageCarousel } from '@/components/carousel/ImageCarousel';

const popularPersons = [
  'Наполеон Бонапарт',
  'Леонардо да Винчи',
  'Принцесса Клеопатра',
  'Альберт Эйнштейн',
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <Header />

      <main className="flex-1 flex flex-col items-center">
        {/* Центрированный блок как на BookVision */}
        <section className="w-full flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl text-center space-y-8">
            <div className="flex items-center justify-center gap-2 text-sm text-sky-300">
              <span className="text-lg">✦</span>
              <span className="uppercase tracking-[0.2em] text-xs text-sky-200/80">
                Исторические образы
              </span>
              <span className="text-lg">✦</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-slate-50">
              Оживите героев истории
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-md mx-auto leading-relaxed">
              Исторические личности, которых вы всегда представляли в воображении.
              Нейросеть даёт шанс увидеть их по‑новому.
            </p>

            <div className="space-y-4">
              <Link
                href="/generate"
                className="inline-flex items-center justify-center rounded-full bg-sky-400 px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-300 transition-colors"
              >
                Воссоздать историю
              </Link>

              <p className="text-xs text-slate-400">
                Введите любого исторического персонажа и посмотрите, как его
                «увидит» искусственный интеллект.
              </p>
            </div>

            {/* Карусель с изображениями */}
            <div className="w-full max-w-4xl mx-auto">
              <ImageCarousel />
            </div>

            <div className="pt-6 border-t border-slate-800">
              <h2 className="text-sm font-medium text-slate-200 mb-3">
                Популярные исторические личности
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {popularPersons.map((name) => (
                  <Link
                    key={name}
                    href={`/generate?person=${encodeURIComponent(name)}`}
                    className="group rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 text-left hover:border-sky-400/70 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-slate-50">
                          {name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Нажмите для генерации
                        </div>
                      </div>
                      <span className="text-xs text-sky-300 group-hover:translate-x-0.5 transition-transform">
                        ↗
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-4 text-[11px] text-slate-500">
              <p>
                Historical Characters AI — проект, вдохновлённый идеей Book
                Vision, но посвящённый героям реальной истории.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
