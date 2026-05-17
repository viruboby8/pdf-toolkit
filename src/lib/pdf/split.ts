import { PDFDocument } from 'pdf-lib';
import { zipSync } from 'fflate';

export interface SplitPart { name: string; bytes: Uint8Array }

export async function splitEveryN(file: File, n: number): Promise<SplitPart[]> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const total = src.getPageCount();
  const parts: SplitPart[] = [];
  for (let i = 0; i < total; i += n) {
    const dst = await PDFDocument.create();
    const indices = Array.from({ length: Math.min(n, total - i) }, (_, k) => i + k);
    const pages = await dst.copyPages(src, indices);
    pages.forEach(p => dst.addPage(p));
    parts.push({ name: `part-${parts.length + 1}.pdf`, bytes: await dst.save() });
  }
  return parts;
}

export async function splitByRange(file: File, start: number, end: number): Promise<SplitPart> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const dst = await PDFDocument.create();
  const total = src.getPageCount();
  const s = Math.max(0, start - 1);
  const e = Math.min(total - 1, end - 1);
  const indices = Array.from({ length: e - s + 1 }, (_, k) => s + k);
  const pages = await dst.copyPages(src, indices);
  pages.forEach(p => dst.addPage(p));
  return { name: `pages-${start}-${end}.pdf`, bytes: await dst.save() };
}

export function zipParts(parts: SplitPart[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const p of parts) entries[p.name] = p.bytes;
  return zipSync(entries);
}
