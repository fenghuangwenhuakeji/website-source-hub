import { Blob, File } from 'node:buffer';

// Polyfill WHATWG globals before loading SDKs that transitively pull in undici.
if (typeof globalThis.Blob === 'undefined') {
  (globalThis as typeof globalThis & { Blob: typeof Blob }).Blob = Blob;
}

if (typeof globalThis.File === 'undefined') {
  (globalThis as typeof globalThis & { File: typeof File }).File = File;
}

await import('./server.js');
