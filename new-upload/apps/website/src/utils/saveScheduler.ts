type SaveCallback<T> = (payload: T) => void;

type IdleHandle = number;

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleScheduler = (callback: (deadline: IdleDeadlineLike) => void, options?: { timeout: number }) => IdleHandle;
type IdleCanceler = (handle: IdleHandle) => void;

const requestIdle: IdleScheduler = (callback, options) => {
  const g = globalThis as unknown as { requestIdleCallback?: IdleScheduler; cancelIdleCallback?: IdleCanceler };
  if (typeof window !== 'undefined' && typeof g.requestIdleCallback === 'function') {
    return g.requestIdleCallback(callback, options);
  }

  return window.setTimeout(() => {
    callback({
      didTimeout: true,
      timeRemaining: () => 0,
    });
  }, options?.timeout ?? 1);
};

const cancelIdle: IdleCanceler = (handle) => {
  const g = globalThis as unknown as { requestIdleCallback?: IdleScheduler; cancelIdleCallback?: IdleCanceler };
  if (typeof window !== 'undefined' && typeof g.cancelIdleCallback === 'function') {
    g.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
};

export interface SaveScheduler<T = unknown> {
  schedule(payload: T): void;
  flush(): void;
  destroy(): void;
}

export function createSaveScheduler<T>(
  callback: SaveCallback<T>,
  options?: {
    minDelayMs?: number;
    idleTimeoutMs?: number;
  },
): SaveScheduler<T> {
  const minDelayMs = options?.minDelayMs ?? 180;
  const idleTimeoutMs = options?.idleTimeoutMs ?? 500;

  let latestPayload: T | null = null;
  let delayHandle: number | null = null;
  let idleHandle: IdleHandle | null = null;
  let destroyed = false;

  const clearPending = () => {
    if (delayHandle !== null) {
      window.clearTimeout(delayHandle);
      delayHandle = null;
    }

    if (idleHandle !== null) {
      cancelIdle(idleHandle);
      idleHandle = null;
    }
  };

  const run = () => {
    if (destroyed || latestPayload === null) return;

    const payload = latestPayload;
    latestPayload = null;
    callback(payload);
  };

  const queueIdleFlush = () => {
    idleHandle = requestIdle(() => {
      idleHandle = null;
      run();
    }, { timeout: idleTimeoutMs });
  };

  return {
    schedule(payload: T) {
      if (destroyed) return;

      latestPayload = payload;
      clearPending();
      delayHandle = window.setTimeout(() => {
        delayHandle = null;
        queueIdleFlush();
      }, minDelayMs);
    },
    flush() {
      if (destroyed) return;
      clearPending();
      run();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearPending();
      latestPayload = null;
    },
  };
}
