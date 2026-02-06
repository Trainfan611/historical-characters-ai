import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-50">
              Пользовательское соглашение
            </h1>
            
            <div className="prose prose-invert max-w-none text-slate-300 space-y-4 text-sm">
              <p className="text-xs text-slate-400">
                Последнее обновление: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <section>
                <h2 className="text-lg font-semibold mb-3 text-slate-200">1. Общие положения</h2>
                <p>
                  Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между 
                  администрацией платформы Historical Characters AI (далее — «Платформа») и пользователем 
                  (далее — «Пользователь») при использовании сервиса генерации изображений исторических личностей.
                </p>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold mb-3 text-slate-200">2. Условия использования</h2>
                <p>
                  Используя Платформу, Пользователь соглашается с условиями настоящего Соглашения. 
                  Если Пользователь не согласен с условиями, он должен прекратить использование Платформы.
                </p>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold mb-3 text-slate-200">3. Регистрация и авторизация</h2>
                <p>
                  Для использования Платформы необходимо пройти авторизацию через Telegram. 
                  Пользователь обязуется предоставить достоверную информацию при регистрации.
                </p>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold mb-3 text-slate-200">4. Ограничения использования</h2>
                <p>
                  Платформа предоставляет ограниченное количество генераций изображений в день. 
                  Пользователь обязуется не использовать Платформу для незаконных целей и не нарушать 
                  права третьих лиц.
                </p>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold mb-3 text-slate-200">5. Интеллектуальная собственность</h2>
                <p>
                  Сгенерированные изображения являются результатом работы искусственного интеллекта. 
                  Пользователь получает право использовать сгенерированные изображения в личных целях.
                </p>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold mb-3 text-slate-200">6. Ответственность</h2>
                <p>
                  Платформа не несёт ответственности за точность исторических данных, используемых для генерации. 
                  Сгенерированные изображения являются художественной интерпретацией и могут не соответствовать 
                  историческим фактам.
                </p>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold mb-3 text-slate-200">7. Изменения в Соглашении</h2>
                <p>
                  Администрация Платформы оставляет за собой право изменять условия настоящего Соглашения. 
                  Изменения вступают в силу с момента публикации на Платформе.
                </p>
              </section>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800">
              <Link 
                href="/"
                className="text-xs text-slate-400 hover:text-sky-300 transition-colors"
              >
                ← Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
