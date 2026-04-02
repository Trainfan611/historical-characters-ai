export type PlanId = 'free' | 'pro100' | 'custom';

export interface PlanInfo {
  id: PlanId;
  name: string;
  dailyLimit: number | null;
  priceRubPerMonth: number | null;
  description: string;
}

export const PLAN_CATALOG: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    dailyLimit: 15,
    priceRubPerMonth: 0,
    description: 'Базовый доступ после подписки на Telegram-канал',
  },
  {
    id: 'pro100',
    name: 'Pro 100',
    dailyLimit: 100,
    priceRubPerMonth: 599,
    description: '100 генераций в день',
  },
  {
    id: 'custom',
    name: 'Custom',
    dailyLimit: null,
    priceRubPerMonth: null,
    description: 'Лимит выше 100 генераций в день - по запросу',
  },
];

function getPaidTelegramIds(): Set<string> {
  const raw = process.env.PAID_SUBSCRIBERS_TELEGRAM_IDS || '';
  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return new Set(ids);
}

export function getUserPlan(telegramId: string | undefined, isChannelSubscribed: boolean): PlanInfo | null {
  if (!telegramId || !isChannelSubscribed) {
    return null;
  }

  const paidIds = getPaidTelegramIds();
  if (paidIds.has(telegramId)) {
    return PLAN_CATALOG.find((plan) => plan.id === 'pro100') || null;
  }

  return PLAN_CATALOG.find((plan) => plan.id === 'free') || null;
}

export function getDailyLimitForUser(telegramId: string | undefined, isChannelSubscribed: boolean): number {
  const plan = getUserPlan(telegramId, isChannelSubscribed);
  return plan?.dailyLimit ?? 0;
}

export function getSalesContact(): string {
  return process.env.SUBSCRIPTION_SALES_CONTACT || '@Martynov_DA';
}
