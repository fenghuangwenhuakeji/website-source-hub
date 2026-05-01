/**
 * Simple window manager
 * Manages App window states on the desktop
 */

import { getAppDisplayName, getAppDefaultSize } from './appRegistry';

export interface WindowState {
  appId: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  prevSize?: { x: number; y: number; width: number; height: number };
}

type Listener = () => void;
const listeners = new Set<Listener>();

let windows: WindowState[] = [];
let nextZ = 10;
let offsetCounter = 0;

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getWindows(): WindowState[] {
  return windows;
}

export function openWindow(appId: number): void {
  const idx = windows.findIndex((w) => w.appId === appId);
  if (idx !== -1) {
    // Focus existing window - create new object
    windows = windows.map((w, i) =>
      i === idx ? { ...w, zIndex: ++nextZ, minimized: false } : w
    );
    notify();
    return;
  }

  const size = getAppDefaultSize(appId);
  const offset = (offsetCounter++ % 5) * 30;

  const win: WindowState = {
    appId,
    title: getAppDisplayName(appId),
    x: 80 + offset,
    y: 40 + offset,
    width: size.width,
    height: size.height,
    zIndex: ++nextZ,
    minimized: false,
    maximized: false,
  };

  windows = [...windows, win];
  notify();
}

export function closeWindow(appId: number): void {
  windows = windows.filter((w) => w.appId !== appId);
  notify();
}

export function closeAllWindows(): void {
  windows = [];
  notify();
}

export function focusWindow(appId: number): void {
  const idx = windows.findIndex((w) => w.appId === appId);
  if (idx !== -1) {
    windows = windows.map((w, i) =>
      i === idx ? { ...w, zIndex: ++nextZ, minimized: false } : w
    );
    notify();
  }
}

export function minimizeWindow(appId: number): void {
  const idx = windows.findIndex((w) => w.appId === appId);
  if (idx !== -1) {
    windows = windows.map((w, i) =>
      i === idx ? { ...w, minimized: true } : w
    );
    notify();
  }
}

export function moveWindow(appId: number, x: number, y: number): void {
  const idx = windows.findIndex((w) => w.appId === appId);
  if (idx !== -1) {
    windows = windows.map((w, i) =>
      i === idx ? { ...w, x, y } : w
    );
    notify();
  }
}

export function resizeWindow(appId: number, width: number, height: number): void {
  const idx = windows.findIndex((w) => w.appId === appId);
  if (idx !== -1) {
    windows = windows.map((w, i) =>
      i === idx ? { ...w, width: Math.max(300, width), height: Math.max(200, height) } : w
    );
    notify();
  }
}

export function maximizeWindow(appId: number): void {
  const idx = windows.findIndex((w) => w.appId === appId);
  if (idx === -1) return;

  windows = windows.map((w, i) => {
    if (i !== idx) return w;

    if (w.maximized) {
      // Restore to previous size
      if (w.prevSize) {
        return {
          ...w,
          x: w.prevSize.x,
          y: w.prevSize.y,
          width: w.prevSize.width,
          height: w.prevSize.height,
          maximized: false,
          prevSize: undefined,
        };
      }
      return { ...w, maximized: false, prevSize: undefined };
    } else {
      // Save current size and maximize
      return {
        ...w,
        prevSize: { x: w.x, y: w.y, width: w.width, height: w.height },
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight - 48, // Subtract taskbar height
        maximized: true,
      };
    }
  });
  notify();
}
