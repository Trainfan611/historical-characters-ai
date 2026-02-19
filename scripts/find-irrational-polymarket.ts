import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  outcomes: {
    id: string;
    title: string;
    price: number;
    volume: number;
  }[];
  volume: number;
  liquidity: number;
  endDate: string;
  imageUrl?: string;
  category: string;
  createdAt: string;
}

interface MarketAnalysis {
  market: PolymarketMarket;
  irrationalityScore: number;
  reasons: string[];
  priceChange24h?: number;
  isOverpriced: boolean;
  isUnderpriced: boolean;
}

// GraphQL запрос для получения активных рынков
const GET_MARKETS_QUERY = `
  query GetMarkets($limit: Int, $offset: Int) {
    markets(
      limit: $limit
      offset: $offset
      active: true
      sortBy: VOLUME
    ) {
      id
      question
      slug
      conditionId
      outcomes {
        id
        title
        price
        volume
      }
      volume
      liquidity
      endDate
      imageUrl
      category
      createdAt
    }
  }
`;

// Альтернативный способ через REST API (если GraphQL не работает)
async function fetchMarketsViaREST(): Promise<PolymarketMarket[]> {
  const endpoints = [
    'https://clob.polymarket.com/markets',
    'https://api.polymarket.com/markets',
    'https://polymarket.com/api/markets',
    'https://clob.polymarket.com/clob/markets',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, {
        params: {
          active: true,
          limit: 200,
          sort: 'volume',
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response.data?.markets && Array.isArray(response.data.markets)) {
        return response.data.markets;
      }
    } catch (error: any) {
      // Пробуем следующий endpoint
      if (error.response?.status !== 404) {
        console.log(`⚠️ ${endpoint}: ${error.response?.status || error.message}`);
      }
      continue;
    }
  }
  
  return [];
}

// Генерация тестовых данных для демонстрации работы скрипта
function generateMockMarkets(): PolymarketMarket[] {
  console.log('📝 Используются тестовые данные для демонстрации...\n');
  
  return [
    {
      id: '1',
      question: 'Will Bitcoin hit $100k by end of 2024?',
      slug: 'bitcoin-100k-2024',
      conditionId: 'cond-1',
      outcomes: [
        { id: 'out-1', title: 'Yes', price: 0.985, volume: 15234.56 },
        { id: 'out-2', title: 'No', price: 0.015, volume: 234.12 },
      ],
      volume: 15468.68,
      liquidity: 45.00,
      endDate: new Date('2024-12-31').toISOString(),
      category: 'Crypto',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      question: 'Will Trump win 2024 election?',
      slug: 'trump-2024-election',
      conditionId: 'cond-2',
      outcomes: [
        { id: 'out-3', title: 'Yes', price: 0.025, volume: 890.45 },
        { id: 'out-4', title: 'No', price: 0.975, volume: 34567.89 },
      ],
      volume: 35458.34,
      liquidity: 120.50,
      endDate: new Date('2024-11-05').toISOString(),
      category: 'Politics',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      question: 'Will AI achieve AGI by 2025?',
      slug: 'ai-agi-2025',
      conditionId: 'cond-3',
      outcomes: [
        { id: 'out-5', title: 'Yes', price: 0.48, volume: 12345.67 },
        { id: 'out-6', title: 'No', price: 0.52, volume: 13456.78 },
      ],
      volume: 25802.45,
      liquidity: 500.00,
      endDate: new Date('2025-12-31').toISOString(),
      category: 'Technology',
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      question: 'Will Ethereum reach $5000?',
      slug: 'ethereum-5000',
      conditionId: 'cond-4',
      outcomes: [
        { id: 'out-7', title: 'Yes', price: 0.012, volume: 234.56 },
        { id: 'out-8', title: 'No', price: 0.988, volume: 19234.56 },
      ],
      volume: 19469.12,
      liquidity: 25.00,
      endDate: new Date('2024-06-30').toISOString(),
      category: 'Crypto',
      createdAt: new Date().toISOString(),
    },
    {
      id: '5',
      question: 'Will there be a recession in 2024?',
      slug: 'recession-2024',
      conditionId: 'cond-5',
      outcomes: [
        { id: 'out-9', title: 'Yes', price: 0.35, volume: 5678.90 },
        { id: 'out-10', title: 'No', price: 0.65, volume: 10567.89 },
      ],
      volume: 16246.79,
      liquidity: 300.00,
      endDate: new Date('2024-12-31').toISOString(),
      category: 'Economics',
      createdAt: new Date().toISOString(),
    },
  ];
}

// Получение данных через GraphQL
async function fetchMarketsViaGraphQL(): Promise<PolymarketMarket[]> {
  const endpoints = [
    'https://api.polymarket.com/graphql',
    'https://clob.polymarket.com/graphql',
    'https://polymarket.com/graphql',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(
        endpoint,
        {
          query: GET_MARKETS_QUERY,
          variables: {
            limit: 200,
            offset: 0,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          timeout: 15000,
        }
      );

      if (response.data?.data?.markets) {
        return response.data.data.markets;
      }
      if (response.data?.markets) {
        return response.data.markets;
      }
    } catch (error: any) {
      // Пробуем следующий endpoint
      if (error.response) {
        console.log(`⚠️ ${endpoint}: ${error.response.status} ${error.response.statusText}`);
      }
      continue;
    }
  }
  
  return [];
}

// Анализ рынка на иррациональность
function analyzeMarket(market: PolymarketMarket): MarketAnalysis {
  const reasons: string[] = [];
  let irrationalityScore = 0;
  let isOverpriced = false;
  let isUnderpriced = false;

  // Проверка на экстремальные цены
  const mainOutcome = market.outcomes[0];
  const price = mainOutcome?.price || 0;
  const volume = market.volume || 0;
  const liquidity = market.liquidity || 0;

  // 1. Цена слишком близка к 0 или 1 (но не должна быть)
  // Более строгие критерии для завышенных/заниженных цен
  if (price < 0.05 && volume > 500) {
    irrationalityScore += 35;
    isUnderpriced = true;
    reasons.push(`⬇️ Цена слишком низкая (${(price * 100).toFixed(2)}%) при объеме $${volume.toFixed(0)}`);
  }

  if (price > 0.95 && volume > 500) {
    irrationalityScore += 35;
    isOverpriced = true;
    reasons.push(`⬆️ Цена слишком высокая (${(price * 100).toFixed(2)}%) при объеме $${volume.toFixed(0)}`);
  }

  // Дополнительная проверка для очень экстремальных цен
  if (price < 0.02 && volume > 200) {
    irrationalityScore += 20;
    isUnderpriced = true;
    reasons.push(`🔻 КРИТИЧЕСКИ низкая цена (${(price * 100).toFixed(2)}%)`);
  }

  if (price > 0.98 && volume > 200) {
    irrationalityScore += 20;
    isOverpriced = true;
    reasons.push(`🔺 КРИТИЧЕСКИ высокая цена (${(price * 100).toFixed(2)}%)`);
  }

  // 2. Низкая ликвидность при экстремальных ценах
  if (liquidity < 100 && (price < 0.1 || price > 0.9) && volume > 200) {
    irrationalityScore += 25;
    reasons.push(`💧 Низкая ликвидность ($${liquidity.toFixed(0)}) при экстремальной цене`);
  }

  // 3. Очень низкий объем при экстремальных ценах
  if (volume < 500 && (price < 0.05 || price > 0.95)) {
    irrationalityScore += 20;
    reasons.push(`📉 Очень низкий объем ($${volume.toFixed(0)}) при экстремальной цене`);
  }

  // 3.5. Высокий объем, но цена не соответствует (возможная манипуляция)
  if (volume > 10000 && (price < 0.1 || price > 0.9)) {
    irrationalityScore += 15;
    reasons.push(`⚠️ Высокий объем ($${volume.toFixed(0)}) при подозрительной цене - возможна манипуляция`);
  }

  // 4. Цена около 0.5, но должна быть явно определена (если есть несколько исходов)
  if (market.outcomes.length === 2) {
    const price1 = market.outcomes[0].price;
    const price2 = market.outcomes[1].price;
    const diff = Math.abs(price1 - price2);
    
    // Если цены очень близки к 0.5, но событие должно быть определенным
    if (diff < 0.1 && volume > 5000) {
      irrationalityScore += 15;
      reasons.push(`Неопределенность при высоком объеме: цены ${(price1 * 100).toFixed(2)}% vs ${(price2 * 100).toFixed(2)}%`);
    }
  }

  // 5. Проверка на аномалии в распределении объемов между исходами
  if (market.outcomes.length > 1) {
    const volumes = market.outcomes.map(o => o.volume);
    const maxVol = Math.max(...volumes);
    const minVol = Math.min(...volumes);
    
    if (maxVol > 0 && minVol / maxVol < 0.01 && volume > 1000) {
      irrationalityScore += 10;
      reasons.push(`Сильный дисбаланс объемов между исходами`);
    }
  }

  return {
    market,
    irrationalityScore,
    reasons,
    isOverpriced,
    isUnderpriced,
  };
}

// Основная функция
async function findIrrationalMarkets() {
  console.log('🔍 Поиск иррациональных рынков на Polymarket...\n');

  let markets: PolymarketMarket[] = [];

  // Пробуем получить данные через GraphQL
  console.log('📡 Получение данных через GraphQL API...');
  markets = await fetchMarketsViaGraphQL();

  // Если не получилось, пробуем REST
  if (markets.length === 0) {
    console.log('📡 Попытка получения данных через REST API...');
    markets = await fetchMarketsViaREST();
  }

  if (markets.length === 0) {
    console.log('⚠️ Не удалось получить данные с Polymarket API');
    console.log('📝 Используются тестовые данные для демонстрации работы скрипта\n');
    console.log('💡 Для работы с реальными данными:');
    console.log('   1. Проверьте документацию Polymarket API: https://docs.polymarket.com/');
    console.log('   2. Возможно, требуется API ключ или специальная аутентификация');
    console.log('   3. Используйте официальный Polymarket SDK\n');
    
    // Используем тестовые данные для демонстрации
    markets = generateMockMarkets();
  }

  console.log(`✅ Получено ${markets.length} рынков\n`);

  // Анализируем все рынки
  const analyses: MarketAnalysis[] = markets.map(analyzeMarket);

  // Фильтруем только иррациональные (score > 15 для более широкого охвата)
  const irrationalMarkets = analyses
    .filter(a => a.irrationalityScore > 15)
    .sort((a, b) => b.irrationalityScore - a.irrationalityScore);

  // Выводим результаты
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🎯 Найдено ${irrationalMarkets.length} иррациональных рынков\n`);

  if (irrationalMarkets.length === 0) {
    console.log('✅ Иррациональных рынков не найдено (или критерии слишком строгие)');
    console.log('\n💡 Попробуйте снизить порог irrationalityScore в коде');
    return;
  }

  irrationalMarkets.forEach((analysis, index) => {
    const m = analysis.market;
    const mainOutcome = m.outcomes[0];
    const price = mainOutcome?.price || 0;

    console.log(`\n${index + 1}. ${m.question}`);
    console.log(`   🔗 https://polymarket.com/event/${m.slug}`);
    console.log(`   💰 Цена: ${(price * 100).toFixed(2)}%`);
    console.log(`   📊 Объем: $${m.volume.toFixed(2)}`);
    console.log(`   💧 Ликвидность: $${m.liquidity.toFixed(2)}`);
    console.log(`   📈 Иррациональность: ${analysis.irrationalityScore}/100`);
    console.log(`   ${analysis.isOverpriced ? '⬆️ ЗАВЫШЕНА' : analysis.isUnderpriced ? '⬇️ ЗАНИЖЕНА' : '⚠️ АНОМАЛИЯ'}`);
    console.log(`   📝 Причины:`);
    analysis.reasons.forEach(reason => {
      console.log(`      • ${reason}`);
    });
    console.log(`   🏷️ Категория: ${m.category || 'N/A'}`);
    if (m.endDate) {
      const endDate = new Date(m.endDate);
      console.log(`   ⏰ Окончание: ${endDate.toLocaleString('ru-RU')}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`\n📊 Статистика:`);
  console.log(`   Всего рынков: ${markets.length}`);
  console.log(`   Иррациональных: ${irrationalMarkets.length}`);
  console.log(`   Завышенных: ${irrationalMarkets.filter(m => m.isOverpriced).length}`);
  console.log(`   Заниженных: ${irrationalMarkets.filter(m => m.isUnderpriced).length}`);

  // Сохранение результатов в JSON файл
  if (irrationalMarkets.length > 0) {
    const outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `irrational-markets-${timestamp}.json`);
    
    const output = {
      timestamp: new Date().toISOString(),
      totalMarkets: markets.length,
      irrationalCount: irrationalMarkets.length,
      overpricedCount: irrationalMarkets.filter(m => m.isOverpriced).length,
      underpricedCount: irrationalMarkets.filter(m => m.isUnderpriced).length,
      markets: irrationalMarkets.map(a => ({
        question: a.market.question,
        slug: a.market.slug,
        url: `https://polymarket.com/event/${a.market.slug}`,
        price: a.market.outcomes[0]?.price || 0,
        volume: a.market.volume,
        liquidity: a.market.liquidity,
        category: a.market.category,
        irrationalityScore: a.irrationalityScore,
        isOverpriced: a.isOverpriced,
        isUnderpriced: a.isUnderpriced,
        reasons: a.reasons,
        endDate: a.market.endDate,
      })),
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n💾 Результаты сохранены в: ${outputFile}`);
  }
}

// Запуск
findIrrationalMarkets().catch(console.error);
