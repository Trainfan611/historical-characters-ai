import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ContactsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-semibold mb-4 text-slate-50">
              Контакты
            </h1>
            <p className="text-slate-400">
              Свяжитесь с нами, если у вас есть вопросы или предложения
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-sky-300 mb-4">
                Способы связи
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">📧</div>
                  <div>
                    <div className="font-medium text-slate-200">Email</div>
                    <div className="text-slate-400 text-sm">
                      support@historical-characters.ai
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">💬</div>
                  <div>
                    <div className="font-medium text-slate-200">Telegram</div>
                    <div className="text-slate-400 text-sm">
                      @historical_characters_support
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <h2 className="text-xl font-semibold text-sky-300 mb-4">
                Обратная связь
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Мы всегда рады услышать ваши отзывы, предложения и замечания.
                Напишите нам, и мы обязательно ответим!
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sky-300 hover:text-sky-200 transition-colors"
              >
                <span>←</span>
                <span>Вернуться на главную</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
