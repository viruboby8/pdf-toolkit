import * as Comlink from 'comlink';
import type { PdfApi, PdfClient } from '@/lib/pdf/types';

let proxy: PdfClient | null = null;
let worker: Worker | null = null;

export function getPdfClient(): PdfClient {
  if (!proxy) {
    worker = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
    proxy = Comlink.wrap<PdfApi>(worker);
    addEventListener('pagehide', () => {
      proxy?.cleanupAll();
      worker?.terminate();
      proxy = null;
      worker = null;
    });
  }
  return proxy;
}

export { Comlink };
