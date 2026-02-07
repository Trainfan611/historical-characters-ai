/**
 * Утилиты для работы с именами исторических личностей
 */

/**
 * Извлекает только имя и фамилию из строки, убирая дополнительную информацию в скобках
 * Примеры:
 * - "Уинстон Черчилль (премьер-министр)" -> "Уинстон Черчилль"
 * - "Николай II (второй)" -> "Николай II"
 * - "Владимир Путин" -> "Владимир Путин"
 */
export function extractPersonName(fullName: string): string {
  if (!fullName) return '';
  
  // Убираем текст в скобках (и сами скобки)
  let cleaned = fullName.replace(/\([^)]*\)/g, '').trim();
  
  // Убираем лишние пробелы
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Убираем форматирование (звездочки, жирный текст и т.д.)
  cleaned = cleaned.replace(/\*\*/g, '').replace(/\*/g, '').trim();
  
  return cleaned;
}

/**
 * Проверяет, содержит ли имя дополнительную информацию (в скобках)
 */
export function hasAdditionalInfo(name: string): boolean {
  return /\([^)]+\)/.test(name);
}

/**
 * Извлекает дополнительную информацию из скобок
 * Примеры:
 * - "Уинстон Черчилль (премьер-министр)" -> "премьер-министр"
 * - "Николай II (второй)" -> "второй"
 * - "Владимир Путин" -> null
 */
export function extractAdditionalInfo(fullName: string): string | null {
  if (!fullName) return null;
  
  const match = fullName.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

/**
 * Получает полное имя с дополнительной информацией
 * Используется для генерации промпта
 */
export function getFullNameForGeneration(fullName: string): string {
  if (!fullName) return '';
  
  // Убираем только форматирование (звездочки), но оставляем скобки
  let cleaned = fullName.replace(/\*\*/g, '').replace(/\*/g, '').trim();
  
  return cleaned;
}
