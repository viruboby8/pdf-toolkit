import * as Comlink from 'comlink';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { zipSync } from 'fflate';
import * as opfs from '@/lib/opfs';
import type { PdfApi, ProgressFn, Handle } from '@/lib/pdf/types';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const uuid = () => crypto.randomUUID();

const api: PdfApi = {
  async stage(file: File): Promise<Handle> {
    const name = `${uuid()}.bin`;
    await opfs.writeStream(name, file.stream());
    return name;
  },

  async getThumbnails(h: Handle, onProgress: ProgressFn): Promise<ImageBitmap[]> {
    const f = await opfs.readFile(h);
    const buf = await f.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const bitmaps: ImageBitmap[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const scale = 200 / vp.width;
      const v2 = page.getViewport({ scale });
      const canvas = new OffscreenCanvas(Math.round(v2.width), Math.round(v2.height));
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport: v2 }).promise;
      bitmaps.push(canvas.transferToImageBitmap());
      onProgress(i, doc.numPages, 'Rendering thumbnails');
    }
    await doc.destroy();
    return Comlink.transfer(bitmaps, bitmaps);
  },

  async merge(handles: Handle[], onProgress: ProgressFn): Promise<Handle> {
    const out = await PDFDocument.create();
    for (let i = 0; i < handles.length; i++) {
      const f = await opfs.readFile(handles[i]);
      const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach(p => out.addPage(p));
      onProgress(i + 1, handles.length, 'Merging');
    }
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await out.save({ useObjectStreams: true }));
    return name;
  },

  async splitEveryN(h: Handle, n: number, onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const total = src.getPageCount();
    const entries: Record<string, Uint8Array> = {};
    for (let i = 0, k = 0; i < total; i += n, k++) {
      const dst = await PDFDocument.create();
      const idxs = Array.from({ length: Math.min(n, total - i) }, (_, j) => i + j);
      const ps = await dst.copyPages(src, idxs);
      ps.forEach(p => dst.addPage(p));
      entries[`part-${k + 1}.pdf`] = await dst.save();
      onProgress(Math.min(i + n, total), total, 'Splitting');
    }
    const zipName = `${uuid()}.zip`;
    await opfs.writeBytes(zipName, zipSync(entries));
    return zipName;
  },

  async splitByRange(h: Handle, start: number, end: number, onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const total = src.getPageCount();
    const s = Math.max(0, start - 1);
    const e = Math.min(total - 1, end - 1);
    const dst = await PDFDocument.create();
    const idxs = Array.from({ length: e - s + 1 }, (_, k) => s + k);
    const ps = await dst.copyPages(src, idxs);
    ps.forEach(p => dst.addPage(p));
    onProgress(1, 1, 'Extracting range');
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await dst.save());
    return name;
  },

  async rotate(h: Handle, angle: 90 | 180 | 270, pageIdxs: number[] | null, onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const targets = pageIdxs ?? src.getPageIndices();
    src.getPages().forEach((p, i) => {
      if (targets.includes(i)) {
        p.setRotation(degrees((p.getRotation().angle + angle) % 360));
        onProgress(targets.indexOf(i) + 1, targets.length, 'Rotating');
      }
    });
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await src.save());
    return name;
  },

  async reorder(h: Handle, newOrder: number[], onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, newOrder);
    copied.forEach((p, i) => {
      dst.addPage(p);
      onProgress(i + 1, copied.length, 'Reordering');
    });
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await dst.save());
    return name;
  },

  async deletePages(h: Handle, pages: number[], onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const remaining = src.getPageIndices().filter(i => !pages.includes(i));
    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, remaining);
    copied.forEach((p, i) => {
      dst.addPage(p);
      onProgress(i + 1, copied.length, 'Removing pages');
    });
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await dst.save());
    return name;
  },

  async extractPages(h: Handle, pages: number[], onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, pages);
    copied.forEach((p, i) => {
      dst.addPage(p);
      onProgress(i + 1, copied.length, 'Extracting pages');
    });
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await dst.save());
    return name;
  },

  async getResultBlob(h: Handle): Promise<Blob> {
    return opfs.readFile(h);
  },

  async cleanup(h: Handle): Promise<void> {
    await opfs.del(h);
  },

  async cleanupAll(): Promise<void> {
    await opfs.delAll();
  },
};

Comlink.expose(api);
