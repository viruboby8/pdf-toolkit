import type { Remote } from 'comlink';

export type ProgressFn = (current: number, total: number, label?: string) => void;
export type Handle = string;

export interface PdfApi {
  stage(file: File): Promise<Handle>;
  getThumbnails(h: Handle, onProgress: ProgressFn): Promise<ImageBitmap[]>;
  merge(handles: Handle[], onProgress: ProgressFn): Promise<Handle>;
  splitEveryN(h: Handle, n: number, onProgress: ProgressFn): Promise<Handle>;
  splitByRange(h: Handle, start: number, end: number, onProgress: ProgressFn): Promise<Handle>;
  rotate(h: Handle, angle: 90 | 180 | 270, pages: number[] | null, onProgress: ProgressFn): Promise<Handle>;
  reorder(h: Handle, newOrder: number[], onProgress: ProgressFn): Promise<Handle>;
  deletePages(h: Handle, pages: number[], onProgress: ProgressFn): Promise<Handle>;
  extractPages(h: Handle, pages: number[], onProgress: ProgressFn): Promise<Handle>;
  getResultBlob(h: Handle): Promise<Blob>;
  cleanup(h: Handle): Promise<void>;
  cleanupAll(): Promise<void>;
}

export type PdfClient = Remote<PdfApi>;
