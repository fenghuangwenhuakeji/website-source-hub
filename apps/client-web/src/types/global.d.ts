declare global {
  const __ENV__: string;
  interface Window {
    electronAPI?: any;
  }
}

export {};
