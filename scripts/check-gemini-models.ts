/**
 * Скрипт для проверки доступных моделей Gemini через API
 * Запуск: npx tsx scripts/check-gemini-models.ts
 */

import axios from 'axios';

const API_KEY = 'AIzaSyC96SfjQ0IhLTeYihn9e-WgWSZbytXE8KI';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

async function listModels() {
  try {
    console.log('🔍 Проверяю доступные модели Gemini...\n');
    
    const response = await axios.get(
      `${BASE_URL}/models?key=${API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const models = response.data?.models || [];
    
    console.log(`✅ Найдено моделей: ${models.length}\n`);
    
    // Фильтруем модели для генерации изображений
    const imageModels = models.filter((model: any) => 
      model.name?.toLowerCase().includes('image') ||
      model.name?.toLowerCase().includes('imagen') ||
      model.name?.toLowerCase().includes('flash') ||
      model.supportedGenerationMethods?.includes('generateContent')
    );

    console.log('📸 Модели для генерации изображений:');
    console.log('='.repeat(80));
    
    imageModels.forEach((model: any) => {
      console.log(`\n📌 ${model.name}`);
      console.log(`   Display Name: ${model.displayName || 'N/A'}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
      console.log(`   Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
    });

    // Показываем все модели с generateContent
    console.log('\n\n🔧 Все модели с поддержкой generateContent:');
    console.log('='.repeat(80));
    
    const generateContentModels = models.filter((model: any) =>
      model.supportedGenerationMethods?.includes('generateContent')
    );

    generateContentModels.forEach((model: any) => {
      const isImageModel = model.name?.toLowerCase().includes('image') || 
                          model.name?.toLowerCase().includes('imagen');
      const marker = isImageModel ? '📸' : '💬';
      console.log(`${marker} ${model.name}`);
    });

    // Проверяем конкретные модели для генерации изображений
    console.log('\n\n🎯 Проверка конкретных моделей для генерации изображений:');
    console.log('='.repeat(80));
    
    const testModels = [
      'gemini-2.5-flash-image-preview',
      'gemini-2.0-flash-exp-image-generation',
      'imagen-3.0-generate-001',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
    ];

    for (const modelName of testModels) {
      const model = models.find((m: any) => m.name === modelName || m.name?.includes(modelName));
      if (model) {
        console.log(`✅ ${model.name} - доступна`);
        console.log(`   Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      } else {
        console.log(`❌ ${modelName} - не найдена`);
      }
    }

  } catch (error: any) {
    console.error('❌ Ошибка при получении списка моделей:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.error('\n⚠️  Возможно, API ключ не имеет доступа к списку моделей.');
      console.error('Попробуйте использовать модель напрямую.');
    }
  }
}

// Запуск
listModels().catch(console.error);
