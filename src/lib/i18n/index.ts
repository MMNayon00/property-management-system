import bn from './bn';

type TranslationKeys = typeof bn;

const translations = {
  bn,
};

let currentLang: keyof typeof translations = 'bn';

function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

function findTranslation(keys: string[], langObject: any): string | undefined {
  let current: any = langObject;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = get(current, key);
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(key: string, lang: keyof typeof translations = currentLang): string {
  const langTranslations = translations[lang];
  if (!langTranslations) {
    return key;
  }

  // Handle nested keys like "common.appName"
  const keys = key.split('.');
  let translation = findTranslation(keys, langTranslations);

  if (translation) {
    return translation;
  }
  
  // Handle simple keys that might be inside a category
  for (const category in langTranslations) {
    const cat = get(langTranslations, category as keyof TranslationKeys);
    if (typeof cat === 'object' && cat !== null && key in cat) {
       const nested = get(cat, key as any);
       if (typeof nested === 'string') {
         return nested;
       }
    }
  }


  // If no translation is found, return the key itself
  return key;
}

export function setLanguage(lang: keyof typeof translations) {
  currentLang = lang;
}

