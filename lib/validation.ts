/**
 * Валидация входных данных для защиты от инъекций и некорректных данных
 */
import { z } from 'zod';

/**
 * Схема валидации для генерации изображения
 */
export const generateImageSchema = z.object({
  personName: z.string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(100, 'Имя слишком длинное')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-'.,]+$/, 'Недопустимые символы в имени')
    .trim(),
  personId: z.string().optional(),
  style: z.enum(['realistic', 'artistic', 'historical']).optional().default('realistic'),
});

/**
 * Схема валидации для поиска личностей
 */
export const searchPersonsSchema = z.object({
  q: z.string()
    .min(2, 'Поисковый запрос должен быть не менее 2 символов')
    .max(100, 'Поисковый запрос слишком длинный')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-'.,]+$/, 'Недопустимые символы')
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  era: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  useInternet: z.coerce.boolean().optional().default(true),
});

/**
 * Валидация и санитизация строки
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
    .slice(0, 1000); // Ограничиваем длину
}
