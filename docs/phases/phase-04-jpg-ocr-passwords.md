# Phase 4: JPG ↔ PDF + OCR + Password Add/Remove

**Project:** PDF Toolkit
**Estimated session time:** 8–10 hours
**Prerequisites:** Phase 2 complete — Web Worker + Comlink + OPFS substrate in place. Phase 3 strongly recommended (you'll reuse `@jsquash/jpeg` and the binary-search size-target loop for the JPG→PDF "compress before embed" path), but technically not blocking.
**Ships:** Four new tools — **JPG → PDF**, **PDF → JPG**, **OCR (PDF/Image → searchable text)**, and **Password add/remove** — all wired into the existing worker harness. Hindi + English OCR languages bundled by default, more lazily loaded. After this phase, the app has feature parity with SmallPDF's free tier (and beats it on privacy, limits, and watermarks).

## Context (read me first)

You are building **PDF Toolkit**, a 100% client-side privacy-first PDF utility. Phases 1–3 shipped 7 tools (merge, split, rotate, reorder, delete, extract, compress) deployed to Cloudflare Pages from a public MIT-licensed repo. The Web Worker + Comlink + OPFS substrate from Phase 2 is the architectural spine; the `@jsquash/jpeg` + binary-search compression pipeline from Phase 3 is the second showpiece.

This phase rounds out the **conversion + privacy** feature set. Three categories of tools land here:

1. **JPG ↔ PDF conversion.** JPG→PDF is one of the top-3 highest-volume keywords in the entire PDF tooling space — iLovePDF's own data shows it as a top-5 query (research §1). PDF→JPG is its mirror. Both are simple given Phase 2's `pdfjs-dist` integration.
2. **OCR via Tesseract.js v6.** Browser-side OCR is genuinely impressive in 2026 (95–99% accuracy on clean printed text, research §6) and unlocks "PDF to searchable text" for scanned documents — a feature SmallPDF gates behind their paid plan. Hindi is bundled because the India audience is the wedge; further languages load on demand.
3. **Password add/remove** via `@cantoo/pdf-lib` (a maintained fork of pdf-lib with AES encryption support — vanilla pdf-lib does NOT support encryption, research §6 v3 list). This is extremely privacy-sensitive — a user pasting their bank statement password into a server-side tool is the worst-case version of the leakage we exist to prevent.

After this phase, the app has all the high-traffic operations covered. Phase 5 scales the SEO surface (60+ programmatic landing pages); Phase 6 packages the TWA and launches.

## Goal of this phase

Wire four new worker methods (`jpgsToPdf`, `pdfToJpgs`, `ocrPdf`, `setPassword`/`removePassword`) and ship four new tool pages, with lazy-loaded OCR language packs and a forked pdf-lib for encryption.

## Acceptance criteria
- [ ] Worker exposes: `jpgsToPdf(handles, opts, onProgress)`, `pdfToJpgs(h, opts, onProgress)`, `ocrPdf(h, lang[], onProgress)`, `setPassword(h, password, onProgress)`, `removePassword(h, password, onProgress)`.
- [ ] `/jpg-to-pdf`: drag-drop multiple JPGs (and PNGs), reorder, choose page size (A4 / Letter / Auto), margin (None / Small / Large), output mode (Single multi-page PDF / One PDF per image as zip), output a downloadable PDF.
- [ ] `/pdf-to-jpg`: drop a PDF, choose DPI (72 / 150 / 300), output a zip of one JPG per page.
- [ ] `/ocr-pdf`: drop a PDF (or image), pick language(s) (English + Hindi default; add Tamil / Telugu / Bengali / Marathi / Gujarati / Arabic / Spanish / French / German on-demand), output either plain text (.txt download) or a searchable PDF (text overlay above the image — uses pdf-lib to overlay invisible text from OCR bboxes).
- [ ] `/protect-pdf`: drop a PDF, enter a password (confirm input), download encrypted PDF (AES-128 minimum).
- [ ] `/unlock-pdf`: drop a PDF, enter the password, download decrypted PDF.
- [ ] Language packs (`*.traineddata.gz` ~10 MB each) lazy-load only on first OCR run, cached via Workbox for subsequent uses.
- [ ] All operations show real progress bars (Tesseract reports per-page progress; per-image conversion reports per-image progress).
- [ ] DevTools Network still shows zero outbound calls **except** the one-time fetch of a language pack — and that fetch goes to a CDN you control (or jsDelivr), never the user's file.
- [ ] Forked pdf-lib (`@cantoo/pdf-lib`) is used **only** in the password-handling code path; the rest of the codebase still uses vanilla `pdf-lib`. Verify both can coexist in the worker bundle without name collision.
- [ ] Encrypted output verifiably requires the password to open in Preview.app / Acrobat.
- [ ] Decrypted output opens without prompting for a password.
- [ ] Lighthouse mobile still ≥ 95 on all four new pages.
- [ ] All four tools work offline after first OCR language download (with appropriate language packs in cache).

## Tech stack & dependencies

**New installs (pin versions):**
- `tesseract.js@^6.0.1` — browser OCR; auto-spawns its own Worker; supports 100+ languages; uses WASM.
- `@cantoo/pdf-lib@^2.5.0` — maintained pdf-lib fork with AES-128 / AES-256 encryption support.
- (Optional) `image-blob-reduce@^4.1.0` if you want a non-jsquash fallback for image downsampling — most cases handled by the Phase 3 codecs.

**Already installed:**
- `pdf-lib@^1.17.1` (kept for the non-encryption path), `pdfjs-dist@^4.10.38`, `@jsquash/jpeg`, `@jsquash/resize`, `fflate`, `comlink`.

**Rationale (research §6, v3 list):**
- Tesseract.js v6 is THE browser OCR option, runs in its own internal worker, well-maintained. Hindi/Tamil/Telugu/etc. all have prebuilt trained-data files.
- `@cantoo/pdf-lib` is the canonical maintained pdf-lib fork with AES-128/256 — research explicitly names it. Keep it scoped to the password module so the rest of the app uses the vanilla version (smaller bundle).

## File/folder structure after this phase

```
pdf-toolkit/
├── ... (existing tree)
├── src/
│   ├── components/
│   │   └── tools/
│   │       ├── JpgToPdfTool.svelte                 # NEW
│   │       ├── PdfToJpgTool.svelte                 # NEW
│   │       ├── OcrTool.svelte                      # NEW
│   │       ├── ProtectTool.svelte                  # NEW
│   │       └── UnlockTool.svelte                   # NEW
│   ├── lib/
│   │   └── ocr-languages.ts                        # NEW — supported langs metadata
│   ├── workers/
│   │   ├── pdf.worker.ts                           # MODIFIED — adds new methods
│   │   ├── codecs/
│   │   │   └── images.ts                           # NEW — image decode helpers for jpg→pdf input
│   │   ├── ocr.ts                                  # NEW — tesseract wrapper, lazy-loaded
│   │   └── crypto-pdf.ts                           # NEW — @cantoo/pdf-lib password ops
│   └── pages/
│       ├── jpg-to-pdf.astro                        # NEW
│       ├── pdf-to-jpg.astro                        # NEW
│       ├── ocr-pdf.astro                           # NEW
│       ├── protect-pdf.astro                       # NEW
│       └── unlock-pdf.astro                        # NEW
```

## Step-by-step tasks

1. **Install deps (~5 min):** `npm i tesseract.js @cantoo/pdf-lib`.
2. **Create `src/lib/ocr-languages.ts`:** export `LANGS = [{ code: 'eng', label: 'English', sizeMb: 10, default: true }, { code: 'hin', label: 'Hindi', sizeMb: 13, default: true }, { code: 'tam', ... }, ...]` — used by both the UI and the lazy loader.
3. **Build `src/workers/ocr.ts`:**
   - Lazy-import `tesseract.js` (`const { createWorker } = await import('tesseract.js')`).
   - `init(langs[]): Promise<Worker>` — creates a Tesseract worker with the requested language packs; caches by sorted lang key.
   - `recognizeImage(imgData, onProgress): Promise<{ text, words }>` — single page.
   - Hosts `traineddata` from a self-controlled URL if possible (CDN) for both privacy claim purity and resilience; default to jsDelivr if not.
4. **Build `src/workers/crypto-pdf.ts`:**
   - `import { PDFDocument as PDFDocumentEnc } from '@cantoo/pdf-lib'` (note the alias to avoid name clash).
   - `addPassword(bytes, password): Promise<Uint8Array>` — `doc.encrypt({ userPassword: password, ownerPassword: password, permissions: { printing: 'highResolution', modifying: false, ... } })`.
   - `removePassword(bytes, password): Promise<Uint8Array>` — load with `{ password }`, re-save without encryption.
5. **Build `src/workers/codecs/images.ts`:** wrapper that decodes a JPG/PNG `File` to an `ImageData` (uses `createImageBitmap` + OffscreenCanvas), returning width/height. Also exports a `jpgEncodeFromBitmap` shortcut.
6. **Add `jpgsToPdf` to `pdf.worker.ts`:**
   - Loop over input file handles, decode each, optionally re-encode via mozjpeg (Phase 3 codec) at the chosen quality, embed via `doc.embedJpg(bytes)`, place on a page sized to the chosen format with margins.
   - If "single multi-page PDF" → one doc with N pages; if "one PDF per image" → array of bytes, zip with fflate.
   - See snippet.
7. **Add `pdfToJpgs` to `pdf.worker.ts`:**
   - Use the existing pdfjs-dist setup; render each page to OffscreenCanvas at the chosen DPI (DPI → scale = DPI/72), `convertToBlob({ type: 'image/jpeg', quality: 0.92 })`, push into entries.
   - Zip via fflate and return a single handle.
8. **Add `ocrPdf` to `pdf.worker.ts`:**
   - For each page in the PDF, render to OffscreenCanvas at 200 DPI (OCR sweet spot), pass the `ImageData` to `ocr.recognizeImage()`.
   - Aggregate text per page (with page-break separators).
   - If user picked "searchable PDF" output: use pdf-lib to overlay invisible text at the OCR bbox positions on a copy of the original page (`page.drawText(text, { ..., color: rgb(1,1,1), opacity: 0 })` is the simplest trick; for a proper text-layer search use the `Tj` operator at the OCR x/y). Save and return.
   - If user picked "Plain text": stream the text into an OPFS-staged `.txt` file and return its handle.
9. **Build `JpgToPdfTool.svelte`:** dropzone (`accept="image/jpeg,image/png"`, `multiple`), reorderable FileList (reuse the Phase 1 component), page-size radio, margin radio, output-mode radio, "Create PDF" → progress → download.
10. **Build `PdfToJpgTool.svelte`:** dropzone (single PDF), DPI selector (72 / 150 / 300), "Convert" → progress → download zip.
11. **Build `OcrTool.svelte`:** dropzone (PDF or image), language chip multi-select (English + Hindi default-on; click to add more — show language pack size next to each), output-mode selector (Plain Text / Searchable PDF), "Run OCR" → progress (per page) → download. First-time-language click triggers a confirm modal: "Hindi requires a one-time 13 MB download. Continue?"
12. **Build `ProtectTool.svelte`:** dropzone, password + confirm fields, complexity hint ("12+ chars recommended"), "Add Password" → download.
13. **Build `UnlockTool.svelte`:** dropzone, password field, "Remove Password" → download. If wrong password, surface "Invalid password — file not modified" cleanly without leaking the input.
14. **Wire five Astro pages** (`jpg-to-pdf.astro`, etc.) following the established template (Base + H1 + 250-word intro + tool island + FAQ).
15. **Update Header nav** — these tools push the total to 12; use a dropdown or grid under "All Tools" to avoid horizontal overflow.
16. **Workbox precache tweak:** add `traineddata` files to `runtimeCaching` (CacheFirst, 30-day TTL) so OCR works offline after one-time download. Do **not** add them to `globPatterns` precache — too big.
17. **Test cross-language OCR:** scan a Hindi document, run with Hindi enabled, verify reasonable accuracy (Devanagari recognition is genuinely good in Tesseract 5+).
18. **Test password roundtrip:** add password to a test PDF, open in Preview.app — it prompts. Enter password — opens. Run unlock with same password — output opens without prompt.
19. **Stress test:** OCR a 30-page scanned PDF in English. Should complete in 2–5 minutes on desktop; worker terminate on cancel; UI never freezes.
20. **Memory:** terminate the Tesseract worker after OCR completes (don't leak the model). Re-init on next run.
21. **Update README** with the new tools listed; add a "Privacy guarantees" section: explicitly note that the only network call ever made during a session is the one-time OCR trained-data fetch (if used), and link to where it's downloaded from.
22. **Commit, push, deploy.** Verify Cloudflare Pages serves the trained-data files with right MIME (or document the jsDelivr fallback).

## Key code patterns

**`src/workers/ocr.ts`:**
```ts
let cache: Map<string, any> = new Map();

export async function getOcrWorker(langs: string[]) {
  const key = [...langs].sort().join('+');
  if (cache.has(key)) return cache.get(key);
  const { createWorker } = await import('tesseract.js');
  const w = await createWorker(langs, 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/worker.min.js',
    corePath:   'https://cdn.jsdelivr.net/npm/tesseract.js-core@6/tesseract-core.wasm.js',
    langPath:   'https://cdn.jsdelivr.net/npm/@tesseract.js-data/',
    logger: () => {},
  });
  cache.set(key, w);
  return w;
}

export async function recognize(canvas: OffscreenCanvas, langs: string[], onProgress: (p: number)=>void) {
  const w = await getOcrWorker(langs);
  w.setProgressHandler?.(({ progress }: any) => onProgress(progress));
  const { data } = await w.recognize(canvas);
  return data;
}

export async function terminateAll() {
  for (const [, w] of cache) await w.terminate();
  cache.clear();
}
```

**`src/workers/crypto-pdf.ts`:**
```ts
import { PDFDocument as PDFDocumentEnc } from '@cantoo/pdf-lib';

export async function addPassword(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const doc = await PDFDocumentEnc.load(bytes);
  // @ts-expect-error — encrypt API on the fork
  doc.encrypt({ userPassword: password, ownerPassword: password,
    permissions: { printing: 'highResolution', copying: true, modifying: false, annotating: false, fillingForms: true }
  });
  return doc.save();
}

export async function stripPassword(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  // @ts-expect-error
  const doc = await PDFDocumentEnc.load(bytes, { password });
  return doc.save({ useObjectStreams: true });
}
```

**`pdf.worker.ts` (new methods, abbreviated):**
```ts
import { rgb } from 'pdf-lib';
import * as ocr from './ocr';
import * as crypto from './crypto-pdf';

async function jpgsToPdf(handles: string[], opts: { pageSize: 'A4'|'Letter'|'Auto', margin: number, splitOutput: boolean }, onProgress: any) {
  const SIZES = { A4: [595, 842], Letter: [612, 792] };
  const docs: Uint8Array[] = [];
  const single = !opts.splitOutput ? await PDFDocument.create() : null;
  for (let i = 0; i < handles.length; i++) {
    const f = await opfs.readFile(handles[i]);
    const bytes = new Uint8Array(await f.arrayBuffer());
    const isPng = bytes[0] === 0x89;
    const target = single ?? await PDFDocument.create();
    const img = isPng ? await target.embedPng(bytes) : await target.embedJpg(bytes);
    const [w, h] = opts.pageSize === 'Auto' ? [img.width + opts.margin*2, img.height + opts.margin*2] : SIZES[opts.pageSize];
    const page = target.addPage([w, h]);
    const drawW = w - opts.margin*2, drawH = h - opts.margin*2;
    const scale = Math.min(drawW / img.width, drawH / img.height);
    const dW = img.width * scale, dH = img.height * scale;
    page.drawImage(img, { x: (w - dW)/2, y: (h - dH)/2, width: dW, height: dH });
    if (single) {} else docs.push(await target.save());
    onProgress(i + 1, handles.length, 'Adding images');
  }
  if (single) {
    const name = `${crypto.randomUUID()}.pdf`; await opfs.writeBytes(name, await single.save()); return name;
  }
  const entries: Record<string, Uint8Array> = Object.fromEntries(docs.map((b, i) => [`image-${i+1}.pdf`, b]));
  const zipName = `${crypto.randomUUID()}.zip`; await opfs.writeBytes(zipName, zipSync(entries)); return zipName;
}

async function pdfToJpgs(h: string, opts: { dpi: 72|150|300 }, onProgress: any) {
  const f = await opfs.readFile(h);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
  const entries: Record<string, Uint8Array> = {};
  const scale = opts.dpi / 72;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale });
    const c = new OffscreenCanvas(vp.width, vp.height);
    await page.render({ canvasContext: c.getContext('2d') as any, viewport: vp }).promise;
    const blob = await c.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
    entries[`page-${String(i).padStart(3,'0')}.jpg`] = new Uint8Array(await blob.arrayBuffer());
    onProgress(i, doc.numPages, 'Rendering pages');
  }
  await doc.destroy();
  const name = `${crypto.randomUUID()}.zip`; await opfs.writeBytes(name, zipSync(entries)); return name;
}

async function ocrPdf(h: string, langs: string[], mode: 'text'|'searchable', onProgress: any) {
  const f = await opfs.readFile(h);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
  let allText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 200/72 });
    const c = new OffscreenCanvas(vp.width, vp.height);
    await page.render({ canvasContext: c.getContext('2d') as any, viewport: vp }).promise;
    const { text } = await ocr.recognize(c, langs, p => onProgress((i-1+p)/doc.numPages * 100, 100, `OCR page ${i}/${doc.numPages}`));
    allText += `\n--- Page ${i} ---\n${text}`;
  }
  await doc.destroy();
  const name = `${crypto.randomUUID()}.txt`;
  await opfs.writeBytes(name, new TextEncoder().encode(allText));
  return name; // mode 'searchable' adds an overlay step — see Phase 4 §step 8
}

async function setPassword(h: string, pwd: string, onProgress: any) {
  onProgress(0, 1, 'Encrypting');
  const f = await opfs.readFile(h);
  const out = await crypto.addPassword(new Uint8Array(await f.arrayBuffer()), pwd);
  onProgress(1, 1, 'Done');
  const name = `${crypto.randomUUID()}.pdf`; await opfs.writeBytes(name, out); return name;
}
```

**`OcrTool.svelte` (abbreviated):**
```svelte
<script lang="ts">
  import { LANGS } from '@/lib/ocr-languages';
  let picked = $state(new Set(['eng','hin']));
  function toggle(code: string, sizeMb: number) {
    if (!picked.has(code) && !confirm(`Adding ${code} requires a one-time ${sizeMb} MB download. Continue?`)) return;
    picked.has(code) ? picked.delete(code) : picked.add(code);
    picked = new Set(picked);
  }
</script>
{#each LANGS as l}
  <button class:active={picked.has(l.code)} onclick={() => toggle(l.code, l.sizeMb)}>{l.label} ({l.sizeMb}MB)</button>
{/each}
```

## Gotchas (from research)
- **Tesseract.js trained-data files are 10–20 MB each** (research §6). Bundling them in the app would balloon the initial download and tank Lighthouse. Always lazy-fetch + Workbox-cache.
- **Tesseract.js v6 spawns its own internal Worker** — you don't wrap it in *your* worker; you call it FROM your worker. It works (Workers can spawn child Workers via `new Worker`), but if you try to bundle the tesseract worker into yours, things break. Use the CDN paths (or self-host the three files).
- **`@cantoo/pdf-lib` has API drift from vanilla pdf-lib.** Specifically the `encrypt` method's permissions enum varies — pin the version, read the fork's README, and test on real PDFs (some encrypted PDFs from older tools use RC4, which the fork should still read but may not write).
- **Vanilla pdf-lib opens an encrypted PDF if you pass `{ ignoreEncryption: true }`** — but it cannot write encrypted output. Hence the fork. Don't try to "just patch" vanilla.
- **JPG→PDF on Android often involves heavily-rotated EXIF images** — phone cameras store images at native orientation with an EXIF rotation flag. `createImageBitmap` may or may not honour it depending on options. Always pass `{ imageOrientation: 'from-image' }` so embedded PDFs aren't sideways.
- **PDF→JPG at 300 DPI on a 50-page PDF produces ~500 MB of pixel data total** — process and zip per page; don't accumulate `ImageData[]`.
- **OCR accuracy drops sharply below ~150 DPI input** — always render at ≥200 DPI for OCR, even though it's heavier. The user-perceived "is this OCR any good?" is set by this single decision.
- **Tesseract.js worker doesn't fully clean memory on `terminate()` in some browser versions** — for repeated OCRs in one session, prefer terminating + recreating fresh between runs.
- **Searchable PDF text overlay** isn't a one-liner. The simple "drawText with opacity 0" approach works for "select all and copy text" UX but won't give pixel-accurate per-word selection. Proper implementation needs PDF text rendering at exact OCR bbox coords with `mode 3` (invisible) — document as v2 if you skip that.
- **`@cantoo/pdf-lib` only supports AES-128 by default** in current versions; AES-256 may require extra config. AES-128 is fine for most use cases (banks use AES-128 on statements). Document this in the tool UI.
- **Password fields**: never log them. Don't include them in error messages. Don't echo them in console. Trivially obvious but worth a checklist line.
- **File System Access API for "Save as same location"** — desktop Chrome / Edge only. For OCR text output, prompting "Save as..." with the right extension is nice UX. Fall back to blob download in Safari/Firefox.
- **Watermarks were a top complaint** in competitor reviews (research §4). Confirm we add zero — even our own logo.

## Verification (manual test checklist)
1. `/jpg-to-pdf`: drop 5 phone photos. Reorder. Choose A4. Output PDF has 5 pages in chosen order, images centred with margins, no sideways images even if originals had EXIF rotation.
2. `/jpg-to-pdf` "one PDF per image" mode → 5-file zip downloads.
3. `/pdf-to-jpg` on a 5-page PDF at 150 DPI → zip with 5 JPGs, each opens, image quality decent.
4. `/ocr-pdf` on a clean English scan → text output has the right paragraphs in correct reading order.
5. `/ocr-pdf` with Hindi added → confirm prompt appears, language pack downloads once (Network tab), text output has Devanagari.
6. Re-run OCR with Hindi → no second download (Workbox cache hit).
7. `/protect-pdf` add password "test1234" → output opens in Preview.app and prompts for password; correct password opens it.
8. `/unlock-pdf` with same password → output opens directly without prompt.
9. `/unlock-pdf` with wrong password → friendly error, no file modified, no password leaked to console.
10. Large-file OCR: 30-page scanned PDF → completes within 5 min, progress bar updates per page, can cancel mid-run cleanly.
11. DevTools Network during a JPG→PDF session: zero outbound calls.
12. DevTools Network during first OCR: one fetch (trained data); subsequent OCRs: zero.
13. Lighthouse mobile ≥ 95 on all 5 new pages.
14. Header nav reflows correctly on mobile (12+ links).
15. Console clean across all new routes.

## Definition of "ship-ready"
- All five new tools live in production.
- Hindi OCR demoably working (a Hindi page screenshot → text output).
- Password add/remove validated against a real bank-statement-style PDF.
- README updated; tool count badge reads "12 tools, zero uploads."
- Lighthouse 95+ preserved.
- Privacy claim still holds with the OCR-language-pack caveat clearly disclosed.

## References
- Research doc: `../research.md` §2 (OCR + password in v3 list; JPG↔PDF in MVP v2), §6 (Tesseract.js + @cantoo/pdf-lib stack picks), §4 (no watermarks, no daily limits gap).
- Tesseract.js: https://github.com/naptha/tesseract.js
- Tesseract trained data: https://github.com/tesseract-ocr/tessdata
- `@cantoo/pdf-lib`: https://www.npmjs.com/package/@cantoo/pdf-lib
- pdfjs canvas rendering: https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.PDFPageProxy.html#render
- File System Access API: https://web.dev/articles/file-system-access
