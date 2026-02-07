'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  overview: {
    totalUsers: number;
    subscribedUsers: number;
    unsubscribedUsers: number;
    subscriptionRate: number;
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    successRate: number;
  };
  period: {
    days: number;
    recentUsers: number;
    recentGenerations: number;
  };
  dailyStats: Array<{
    date: string;
    users: number;
    generations: number;
    successfulGenerations: number;
    failedGenerations: number;
  }>;
  topUsers: Array<{
    user: any;
    generationCount: number;
  }>;
  topPersons: Array<{
    personName: string;
    count: number;
  }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [status, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (response.status === 403) {
        setError('У вас нет прав доступа к админ-панели');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    const isAccessDenied = error.includes('нет прав доступа');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Ошибка доступа</h1>
          <p className="text-slate-300 mb-4">{error}</p>
          {isAccessDenied && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-200 mb-3">
                Чтобы получить доступ к админ-панели, нужно назначить себя администратором.
              </p>
              <Link
                href="/admin/setup"
                className="inline-block px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
              >
                Назначить меня админом
              </Link>
            </div>
          )}
          <Link
            href="/"
            className="text-sky-400 hover:text-sky-300 underline text-sm"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sky-400">Админ-панель</h1>
              <p className="text-sm text-slate-400 mt-1">Управление пользователями и статистика</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              На главную
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Пользователи
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Активность
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </main>
    </div>
  );
}

function OverviewTab({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Всего пользователей"
          value={stats.overview.totalUsers}
          subtitle={`${stats.period.recentUsers} новых за ${stats.period.days} дней`}
          color="blue"
        />
        <MetricCard
          title="Подписанных"
          value={stats.overview.subscribedUsers}
          subtitle={`${stats.overview.subscriptionRate.toFixed(1)}% от всех`}
          color="green"
        />
        <MetricCard
          title="Всего генераций"
          value={stats.overview.totalGenerations}
          subtitle={`${stats.period.recentGenerations} за ${stats.period.days} дней`}
          color="purple"
        />
        <MetricCard
          title="Успешных"
          value={stats.overview.successfulGenerations}
          subtitle={`${stats.overview.successRate.toFixed(1)}% успешности`}
          color="emerald"
        />
      </div>

      {/* Топ пользователи */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Топ пользователей по генерациям</h2>
        <div className="space-y-2">
          {stats.topUsers.slice(0, 10).map((item, index) => (
            <div
              key={item.user?.id || index}
              className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 w-6">#{index + 1}</span>
                <div>
                  <p className="font-medium">
                    {item.user?.firstName || item.user?.username || `ID: ${item.user?.telegramId}`}
                  </p>
                  <p className="text-sm text-slate-400">
                    @{item.user?.username || 'без username'} • {item.user?.telegramId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sky-400">{item.generationCount}</p>
                <p className="text-xs text-slate-400">генераций</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Топ исторические личности */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Популярные исторические личности</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.topPersons.map((person, index) => (
            <div
              key={index}
              className="p-3 bg-slate-700/50 rounded-lg text-center"
            >
              <p className="font-medium text-sm mb-1">{person.personName}</p>
              <p className="text-sky-400 font-bold">{person.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Статистика по дням */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Статистика по дням (последние {stats.period.days} дней)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-2">Дата</th>
                <th className="text-right p-2">Новых пользователей</th>
                <th className="text-right p-2">Генераций</th>
                <th className="text-right p-2">Успешных</th>
                <th className="text-right p-2">Неудачных</th>
              </tr>
            </thead>
            <tbody>
              {stats.dailyStats.map((day) => (
                <tr key={day.date} className="border-b border-slate-700/50">
                  <td className="p-2">{new Date(day.date).toLocaleDateString('ru-RU')}</td>
                  <td className="text-right p-2">{day.users}</td>
                  <td className="text-right p-2">{day.generations}</td>
                  <td className="text-right p-2 text-emerald-400">{day.successfulGenerations}</td>
                  <td className="text-right p-2 text-red-400">{day.failedGenerations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [subscribed, setSubscribed] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, [page, search, subscribed]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search }),
        ...(subscribed !== 'all' && { subscribed }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="bg-slate-800 rounded-lg p-4 flex gap-4">
        <input
          type="text"
          placeholder="Поиск по имени, username, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-sky-400 focus:outline-none"
        />
        <select
          value={subscribed}
          onChange={(e) => setSubscribed(e.target.value)}
          className="px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-sky-400 focus:outline-none"
        >
          <option value="all">Все</option>
          <option value="true">Подписанные</option>
          <option value="false">Не подписанные</option>
        </select>
      </div>

      {/* Таблица пользователей */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-slate-600 border-t-sky-400 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left p-3">Пользователь</th>
                  <th className="text-left p-3">Telegram ID</th>
                  <th className="text-center p-3">Подписка</th>
                  <th className="text-right p-3">Генераций</th>
                  <th className="text-right p-3">Сегодня</th>
                  <th className="text-right p-3">Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">
                          {user.firstName || user.username || 'Без имени'}
                        </p>
                        <p className="text-xs text-slate-400">
                          @{user.username || 'без username'}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-xs">
                      {user.telegramId}
                    </td>
                    <td className="p-3 text-center">
                      {user.isSubscribed ? (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-medium">{user.stats.totalGenerations}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sky-400">{user.stats.todayGenerations}</span>
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityTab() {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/activity?days=7&groupBy=hour');
      if (!response.ok) throw new Error('Failed to fetch activity');
      const data = await response.json();
      setActivity(data);
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !activity) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-sky-400 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Активность по часам (последние 7 дней)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-2">Время</th>
                <th className="text-right p-2">Всего</th>
                <th className="text-right p-2">Успешных</th>
                <th className="text-right p-2">Неудачных</th>
                <th className="text-right p-2">Уникальных пользователей</th>
              </tr>
            </thead>
            <tbody>
              {activity.activity.slice(-24).map((item: any) => (
                <tr key={item.timestamp} className="border-b border-slate-700/50">
                  <td className="p-2">
                    {new Date(item.timestamp).toLocaleString('ru-RU')}
                  </td>
                  <td className="text-right p-2">{item.total}</td>
                  <td className="text-right p-2 text-emerald-400">{item.successful}</td>
                  <td className="text-right p-2 text-red-400">{item.failed}</td>
                  <td className="text-right p-2">{item.uniqueUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Самые активные пользователи</h2>
        <div className="space-y-2">
          {activity.topActiveUsers.map((user: any, index: number) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 w-6">#{index + 1}</span>
                <div>
                  <p className="font-medium">
                    {user.firstName || user.username || `ID: ${user.telegramId}`}
                  </p>
                  <p className="text-sm text-slate-400">
                    @{user.username || 'без username'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sky-400">{user.totalGenerations}</p>
                <p className="text-xs text-slate-400">
                  Последняя активность: {new Date(user.lastActivityAt).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'emerald';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <p className="text-sm text-slate-400 mb-2">{title}</p>
      <p className={`text-3xl font-bold mb-1 ${colorClasses[color]}`}>
        {value.toLocaleString('ru-RU')}
      </p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
