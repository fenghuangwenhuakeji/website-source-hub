import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  applyThemeMode,
  resolveThemeMode,
  subscribeThemeMode,
  type ThemeMode,
} from '../utils/themePreference';

const HEADER_OFFSET = 96;

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

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

  return (
    <div className="site-shell flex min-h-screen flex-col">
      <Header />
      <main className="site-main flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
