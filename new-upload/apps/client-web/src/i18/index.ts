import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import 'intl-pluralrules';
import translation from './locale';
import { ENABLE_LOCALES, FALLBACK_LNG } from './config';
export * from './config';

interface I18nOptions {
  lng?: string;
  fallbackLng?: string;
}

type Resources = Record<
  string,
  {
    translation: Record<string, unknown>;
  }
>;

// Xingye and Talkie have some custom multi-language handling logic
const CACHED_RESOURCES = (() => {
  const resources: Resources = {} as Resources;
  for (const lng of ENABLE_LOCALES) {
    resources[lng] = {
      translation: translation[lng as keyof typeof translation],
    };
  }
  return resources;
})();

const getResources = () => ({
  fallbackLng: FALLBACK_LNG,
  resources: CACHED_RESOURCES,
});

/**
 * Normalize a full locale (e.g. "zh-CN") to a short code (e.g. "zh").
 * Prefers exact match, then language prefix match, falls back to fallbackLng.
 */
export const normalizeLang = (locale: string): string => {
  if (ENABLE_LOCALES.includes(locale)) {
    return locale;
  }
  const prefix = locale.split('-')[0];
  if (ENABLE_LOCALES.includes(prefix)) {
    return prefix;
  }
  return FALLBACK_LNG;
};

export const initI18n = (options?: I18nOptions) => {
  const { fallbackLng, resources } = getResources();

  const mergedOptions = {
    lng: 'zh',
    fallbackLng,
    interpolation: {
      escapeValue: false, // Do not escape interpolation placeholders
    },
    ...(options || {}),
  };

  return i18n.use(initReactI18next).init({
    resources,
    ...mergedOptions,
  });
};

/**
 * Translation t function for use outside of hooks.
 */
export function translate(...params: Parameters<typeof i18n.t>) {
  return i18n.t(...params);
}

export default i18n;
