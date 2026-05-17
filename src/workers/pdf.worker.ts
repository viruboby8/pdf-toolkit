import * as Comlink from 'comlink';
import { PDFDocument, PDFName, PDFRawStream, degrees } from 'pdf-lib';
import { PDFDocument as CantoPDFDocument } from '@cantoo/pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { zipSync } from 'fflate';
import * as opfs from '@/lib/opfs';
import type { PdfApi, ProgressFn, Handle } from '@/lib/pdf/types';
import type { CompressOpts, CompressResponse } from '@/lib/pdf/compress-types';
import { jpegEncode, jpegDecode } from './codecs/mozjpeg';
import { clampLongestSide } from './codecs/resize';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const uuid = () => crypto.randomUUID();

const api: PdfApi = {
  async stage(file: File): Promise<Handle> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const safeExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'bin';
    const name = `${uuid()}.${safeExt}`;
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

  async compress(h: Handle, opts: CompressOpts, onProgress: ProgressFn): Promise<CompressResponse> {
    const f = await opfs.readFile(h);
    const originalBytes = f.size;
    const inputBytes = new Uint8Array(await f.arrayBuffer());

    const Q_MAP = {
      low:    { q: 40, maxSide: 1200 as number | null },
      medium: { q: 70, maxSide: 1800 as number | null },
      high:   { q: 85, maxSide: null as number | null },
    };

    async function recompressImages(bytes: Uint8Array, q: number, maxSide: number | null): Promise<Uint8Array> {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const objs = doc.context.enumerateIndirectObjects();
      for (const [, obj] of objs) {
        if (!(obj instanceof PDFRawStream)) continue;
        const dict = obj.dict;
        if (dict.get(PDFName.of('Subtype'))?.toString() !== '/Image') continue;
        if (dict.get(PDFName.of('Filter'))?.toString() !== '/DCTDecode') continue;
        const orig = obj.contents as Uint8Array;
        try {
          let img = await jpegDecode(orig);
          if (maxSide) img = await clampLongestSide(img, maxSide);
          const re = await jpegEncode(img, q);
          if (re.byteLength < orig.byteLength) {
            (obj as unknown as { contents: Uint8Array }).contents = re;
            dict.set(PDFName.of('Width'), doc.context.obj(img.width));
            dict.set(PDFName.of('Height'), doc.context.obj(img.height));
            dict.set(PDFName.of('Length'), doc.context.obj(re.byteLength));
          }
        } catch { /* skip unencodable images */ }
      }
      return new Uint8Array(await doc.save({ useObjectStreams: true }));
    }

    let out: Uint8Array;
    let attemptsUsed = 0;
    const fellBackToGs = false;

    if (opts.mode === 'quality') {
      const { q, maxSide } = Q_MAP[opts.quality];
      onProgress(0, 1, 'Compressing images…');
      out = await recompressImages(inputBytes, q, maxSide);
      attemptsUsed = 1;
    } else {
      const target = opts.targetBytes;
      let lo = 10, hi = 85, best: Uint8Array | null = null;
      while (lo <= hi && attemptsUsed < 6) {
        const mid = Math.floor((lo + hi) / 2);
        onProgress(attemptsUsed + 1, 6, `Searching quality ${mid}…`);
        const candidate = await recompressImages(inputBytes, mid, 1500);
        attemptsUsed++;
        if (candidate.byteLength <= target) {
          best = candidate;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      // If we never hit the target, use the smallest we found (quality 10, aggressive clamp)
      out = best ?? await recompressImages(inputBytes, 10, 800);
    }

    const outName = `${uuid()}.pdf`;
    await opfs.writeBytes(outName, out);
    return {
      handle: outName,
      result: {
        originalBytes,
        compressedBytes: out.byteLength,
        percentSaved: Math.max(0, Math.round((1 - out.byteLength / originalBytes) * 100)),
        attemptsUsed,
        fellBackToGs,
      },
    };
  },

  async imagesToPdf(handles: Handle[], onProgress: ProgressFn): Promise<Handle> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < handles.length; i++) {
      const f = await opfs.readFile(handles[i]);
      const bytes = new Uint8Array(await f.arrayBuffer());
      const mime = handles[i].endsWith('.png') ? 'png' : 'jpeg';
      let img;
      try {
        img = mime === 'png'
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
      } catch {
        // Try the other format if detection fails
        try { img = await doc.embedJpg(bytes); } catch { img = await doc.embedPng(bytes); }
      }
      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      onProgress(i + 1, handles.length, `Adding image ${i + 1} of ${handles.length}`);
    }
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await doc.save());
    return name;
  },

  async pdfToImages(h: Handle, onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const buf = await f.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const entries: Record<string, Uint8Array> = {};
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 2 }); // 2x = ~144dpi
      const canvas = new OffscreenCanvas(Math.round(vp.width), Math.round(vp.height));
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport: vp }).promise;
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
      entries[`page-${String(i).padStart(3, '0')}.jpg`] = new Uint8Array(await blob.arrayBuffer());
      onProgress(i, doc.numPages, `Exporting page ${i} of ${doc.numPages}`);
    }
    await doc.destroy();
    const zipName = `${uuid()}.zip`;
    await opfs.writeBytes(zipName, zipSync(entries));
    return zipName;
  },

  async removePassword(h: Handle, password: string, onProgress: ProgressFn): Promise<Handle> {
    const f = await opfs.readFile(h);
    const bytes = new Uint8Array(await f.arrayBuffer());
    onProgress(0, 1, 'Decrypting…');
    const doc = await CantoPDFDocument.load(bytes, {
      password,
      ignoreEncryption: false,
    });
    onProgress(1, 1, 'Saving…');
    const out = await doc.save();
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, new Uint8Array(out));
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
