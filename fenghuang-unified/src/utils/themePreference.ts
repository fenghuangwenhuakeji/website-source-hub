export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'fenghuang_theme_mode';
const LEGACY_KEYS = ['openroom_theme_mode', 'cwq_theme_mode'] as const;
const THEME_EVENT = 'fenghuang-theme-change';

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

const readStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const current = window.localStorage.getItem(STORAGE_KEY);
  if (isThemeMode(current)) {
    return current;
  }

  for (const key of LEGACY_KEYS) {
    const legacy = window.localStorage.getItem(key);
    if (isThemeMode(legacy)) {
      return legacy;
    }
  }

  return null;
};

export const resolveThemeMode = (): ThemeMode => readStoredTheme() ?? 'light';

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
    window.localStorage.setItem(STORAGE_KEY, mode);
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key);
    }
  }

  applyThemeMode(mode);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: mode }));
  }
};

export const subscribeThemeMode = (callback: (mode: ThemeMode) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY || LEGACY_KEYS.includes(event.key as (typeof LEGACY_KEYS)[number])) {
      callback(resolveThemeMode());
    }
  };

  const handleThemeChange = (event: Event) => {
    const nextMode = (event as CustomEvent<ThemeMode>).detail;
    callback(isThemeMode(nextMode) ? nextMode : resolveThemeMode());
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(THEME_EVENT, handleThemeChange as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener);
  };
};
