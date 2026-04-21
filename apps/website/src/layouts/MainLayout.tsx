import { useEffect, useState, type WheelEvent as ReactWheelEvent } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  applyThemeMode,
  resolveThemeMode,
  setPreferredThemeMode,
  subscribeThemeMode,
  type ThemeMode,
} from '../utils/themePreference';

const HEADER_OFFSET = 96;

function findScrollableAncestor(node: HTMLElement | null) {
  let current = node;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      current.scrollHeight > current.clientHeight + 1;

    if (canScroll) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function scrollTargetBy(target: HTMLElement | null, deltaY: number) {
  if (target) {
    target.scrollTop += deltaY;
    return;
  }

  const rootScroller = document.scrollingElement as HTMLElement | null;
  if (rootScroller) {
    rootScroller.scrollTop += deltaY;
    return;
  }

  window.scrollBy({
    top: deltaY,
    left: 0,
    behavior: 'auto',
  });
}

export function MainLayout() {
  const location = useLocation();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => resolveThemeMode());

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        requestAnimationFrame(() => {
          const top = element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
        });
      }
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => subscribeThemeMode(setThemeMode), []);

  const handleDesktopWheel = (event: WheelEvent | ReactWheelEvent<HTMLElement>) => {
    if (window.innerWidth < 1024 || event.ctrlKey) {
      return;
    }

    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) {
      return;
    }

    if (
      target.closest('textarea, select, [contenteditable="true"], .writing-scroll, .library-scroll, .nav-menu')
    ) {
      return;
    }

    const scrollableAncestor = findScrollableAncestor(target);
    if ('cancelable' in event && !event.cancelable) {
      return;
    }

    event.preventDefault();
    scrollTargetBy(
      scrollableAncestor && !scrollableAncestor.classList.contains('site-main') ? scrollableAncestor : null,
      event.deltaY,
    );
  };

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => handleDesktopWheel(event);

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', handleWheel, { capture: true } as EventListenerOptions);
  }, []);

  const toggleThemeMode = () => {
    setPreferredThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`site-shell site-shell-${themeMode} flex min-h-screen flex-col`}>
      <Header themeMode={themeMode} onToggleThemeMode={toggleThemeMode} />
      <main className="site-main flex-1 overflow-visible" onWheelCapture={handleDesktopWheel}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
