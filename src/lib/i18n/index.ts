import tr from './tr.json'
import en from './en.json'
import de from './de.json'

export type Locale = 'tr' | 'en' | 'de'

const dictionaries: Record<Locale, typeof tr> = { tr, en, de }

/**
 * Nested JSON key'lerine erişim sağlar.
 * Örnek: getNestedValue(dict, 'tasks.createButton') => 'Yeni Görev Tanımla'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split('.')
    let current: unknown = obj
    for (const key of keys) {
        if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[key]
        } else {
            return path // fallback: key'in kendisini döndür
        }
    }
    return typeof current === 'string' ? current : path
}

/**
 * Belirtilen locale için çeviri fonksiyonu döndürür.
 */
export function getTranslations(locale: Locale = 'tr') {
    const dict = dictionaries[locale] || dictionaries.tr

    function t(key: string): string {
        return getNestedValue(dict as unknown as Record<string, unknown>, key)
    }

    return { t, locale }
}

export { dictionaries }
