import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/90">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-slate-500 text-xs space-y-1">
          <p>© 2026 Historical Characters. Генерация изображений исторических личностей с помощью AI.</p>
          <p className="text-[11px] text-slate-600">
            Вдохновлено лаконичным интерфейсом Book Vision, адаптировано для героев реальной истории.
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            <Link 
              href="/terms" 
              className="text-sky-400 hover:text-sky-300 underline transition-colors"
            >
              Пользовательское соглашение
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
