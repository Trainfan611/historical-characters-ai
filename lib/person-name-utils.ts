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
