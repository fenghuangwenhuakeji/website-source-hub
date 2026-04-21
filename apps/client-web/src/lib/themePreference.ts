export type ThemeMode = 'light' | 'dark';

export const FENGHUANG_THEME_STORAGE_KEY = 'fenghuang_theme_mode';
export const LEGACY_THEME_STORAGE_KEYS = ['openroom_theme_mode', 'cwq_theme_mode'] as const;
export const FENGHUANG_THEME_EVENT = 'fenghuang-theme-change';

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

const readStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const current = window.localStorage.getItem(FENGHUANG_THEME_STORAGE_KEY);
  if (isThemeMode(current)) {
    return current;
  }

  for (const key of LEGACY_THEME_STORAGE_KEYS) {
    const legacyValue = window.localStorage.getItem(key);
    if (isThemeMode(legacyValue)) {
      return legacyValue;
    }
  }

  return null;
};

export const resolveThemeMode = (): ThemeMode => readStoredTheme() ?? 'dark';

export const applyThemeMode = (mode: ThemeMode): void => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.fenghuangTheme = mode;
  document.documentElement.style.colorScheme = mode;
  document.body?.setAttribute('data-fenghuang-theme', mode);
};

export const setPreferredThemeMode = (mode: ThemeMode): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(FENGHUANG_THEME_STORAGE_KEY, mode);
    for (const key of LEGACY_THEME_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  }

  applyThemeMode(mode);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ThemeMode>(FENGHUANG_THEME_EVENT, { detail: mode }));
  }
};

export const subscribeThemeMode = (callback: (mode: ThemeMode) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === FENGHUANG_THEME_STORAGE_KEY || LEGACY_THEME_STORAGE_KEYS.includes(event.key as (typeof LEGACY_THEME_STORAGE_KEYS)[number])) {
      callback(resolveThemeMode());
    }
  };

  const handleThemeChange = (event: Event) => {
    const nextMode = (event as CustomEvent<ThemeMode>).detail;
    callback(isThemeMode(nextMode) ? nextMode : resolveThemeMode());
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(FENGHUANG_THEME_EVENT, handleThemeChange as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(FENGHUANG_THEME_EVENT, handleThemeChange as EventListener);
  };
};
