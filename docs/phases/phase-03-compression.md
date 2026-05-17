# Phase 3: Compression Pipeline + India Size Presets

**Project:** PDF Toolkit
**Estimated session time:** 10–12 hours
**Prerequisites:** Phase 2 complete — Web Worker + Comlink + OPFS substrate is in place (`src/workers/pdf.worker.ts` exposes a `PdfApi` via `Comlink.expose`; `src/lib/worker-client.ts` returns a typed proxy; OPFS staging works for 100MB+ files).
**Ships:** Two-tier compression pipeline (`mozjpeg-wasm` fast path + `ghostscript-wasm` fallback) wired into the existing worker harness. A `/compress-pdf` tool with quality presets ("Low / Medium / High") **and** target-size presets (the India wedge: 100 KB / 200 KB / 500 KB / 1 MB / 2 MB) implemented as a binary search over JPEG quality. Five new programmatic landing pages (`/compress-pdf-to-100kb`, `-200kb`, `-500kb`, `-1mb`, `-2mb`).

## Context (read me first)

You are building **PDF Toolkit**, a 100% client-side privacy-first PDF utility. Phases 1 and 2 shipped 6 working tools (merge, split, rotate, reorder, delete, extract pages) deployed to Cloudflare Pages from a public MIT-licensed GitHub repo. The architectural substrate from Phase 2 — Web Workers, Comlink RPC, OPFS streaming — handles 300 MB PDFs without bloating the JS heap.

The PDF Toolkit's single biggest growth lever is **compression**, specifically compression-to-a-target-size for Indian government portals. Every state and central government form in India (UPSC, SSC, Railway, PAN, Aadhaar, college admission, visa applications) caps PDF uploads at 100 KB / 200 KB / 500 KB / 1 MB / 2 MB. Users today struggle to hit these caps: server tools (SmallPDF, iLovePDF) require upload-then-process round-trips that take minutes on Indian mobile connections, and most "free" Indian-targeted tools either inject watermarks, compress destructively without hitting the target, or both. A one-click "Compress to exactly under 200 KB" preset is the rare feature where we straightforwardly beat every competitor (research §3, §5).

The technical challenge: `pdf-lib` does **NOT** recompress embedded images. Compressing a PDF means **extracting each embedded image, re-encoding it via canvas or `mozjpeg-wasm` at a lower quality / smaller dimensions, then re-embedding** (research §6, Approach A). For PDFs that are already heavily-text (vector-only), we fall back to `ghostscript-wasm` (Approach B — ~10 MB WASM payload, lazy-loaded). Hitting an exact size cap requires wrapping the encoder in a binary search over JPEG quality (Approach C).

This phase plugs all three approaches into the existing worker. No new worker, no new RPC substrate — just new methods on the `PdfApi` and a new tool page. Phase 4 will reuse the same harness for JPG↔PDF and OCR.

## Goal of this phase

Implement a `compress(handle, target, onProgress)` worker method that re-encodes embedded images via `mozjpeg-wasm`, optionally binary-searches quality to hit a target byte size, optionally falls back to `ghostscript-wasm`, and ships a `/compress-pdf` UI plus five size-target landing pages.

## Acceptance criteria
- [ ] Worker exposes `compress(h, opts, onProgress)` where `opts = { mode: 'quality'|'targetBytes', quality?: 'low'|'medium'|'high', targetBytes?: number, gsFallback?: boolean }`.
- [ ] `mozjpeg-wasm` (or equivalent) is dynamically imported on first compression call — not in initial worker bundle.
- [ ] Pipeline: load PDF → enumerate embedded images via `pdf-lib` → for each image, decode → re-encode via mozjpeg → if smaller, replace; if not, keep original.
- [ ] Quality presets: Low = JPEG q40, Medium = q70, High = q85; downsample to max 1500px on longest side for Low/Medium.
- [ ] Target-size mode runs binary search over JPEG quality (range 10–90, max 6 iterations) until output size is `≤ targetBytes`; if even quality 10 + max downsample doesn't fit, surface a clear error.
- [ ] `ghostscript-wasm` is loaded only on user opt-in (a "Try harder (slower)" toggle) or as automatic fallback when mozjpeg can't hit the target.
- [ ] `/compress-pdf` tool UI: drag-drop, preset chips (Low/Medium/High + India sizes), "Compress" button, progress bar, before/after size + percent saved, download button.
- [ ] Five new Astro pages: `/compress-pdf-to-100kb`, `/compress-pdf-to-200kb`, `/compress-pdf-to-500kb`, `/compress-pdf-to-1mb`, `/compress-pdf-to-2mb` — each is a thin wrapper that opens the compress tool with the target pre-selected and shows targeted intro copy + FAQ.
- [ ] A 5 MB scanned PDF compresses to ≤200 KB on the "200 KB" preset within ~30 seconds on a mid-range Android (Snapdragon 7-gen).
- [ ] Result PDF still renders correctly in Preview.app / Acrobat — no missing pages, no garbled images.
- [ ] DevTools Network shows zero outbound calls during compression (still privacy-pure).
- [ ] `_headers` confirms `COOP: same-origin` + `COEP: require-corp` so SharedArrayBuffer works (`mozjpeg-wasm` benefits from threads in supported builds).
- [ ] Lighthouse mobile still ≥ 95 on `/compress-pdf` (the page lazy-loads the WASM; initial JS unaffected).
- [ ] Compression progress messages: "Decoding page N of M" → "Re-encoding image X" → "Searching quality (q=N, attempt N/6)" → "Done."

## Tech stack & dependencies

**New installs (pin versions):**
- `@jsquash/jpeg@^1.6.0` — modern, well-maintained WASM port of mozjpeg + decoder. ~120 KB WASM. Worker-friendly. Replaces hand-rolling `mozjpeg-wasm`.
- `@jsquash/resize@^2.1.0` — WASM-backed image resize for downsampling.
- `gs-wasm@^10.04.0` (or `@laurentmmeyer/ghostscript-pdf-compress.wasm`) — Ghostscript-in-WASM for the fallback path (~9 MB gzipped). Loaded dynamically only when needed.

**Already installed:**
- `pdf-lib@^1.17.1`, `pdfjs-dist@^4.10.38`, `comlink@^4.4.2`, etc.

**Rationale (research §6, Approaches A/B/C):**
- `@jsquash/jpeg` is the 2026 best-in-class browser JPEG codec — same encoder Squoosh uses, actively maintained, threaded build available. Way better quality at small sizes than canvas `toBlob('image/jpeg')`.
- `@jsquash/resize` to downsample before re-encoding (huge size win on scanned 300 DPI images that don't need to be 300 DPI for a 200 KB upload).
- Ghostscript-WASM is the "do everything Ghostscript does" big hammer; we keep it behind a toggle / automatic fallback so the 9 MB cost only hits users who need it.

## File/folder structure after this phase

```
pdf-toolkit/
├── ... (existing tree)
├── src/
│   ├── components/
│   │   └── tools/
│   │       └── CompressTool.svelte             # NEW
│   ├── lib/
│   │   └── pdf/
│   │       └── compress-types.ts               # NEW — CompressOpts, CompressResult
│   ├── workers/
│   │   ├── pdf.worker.ts                       # MODIFIED — adds compress(), lazy-imports codecs
│   │   └── codecs/                             # NEW — wrappers around jsquash + gs-wasm
│   │       ├── mozjpeg.ts
│   │       ├── resize.ts
│   │       └── ghostscript.ts
│   └── pages/
│       ├── compress-pdf.astro                  # NEW — main tool page
│       ├── compress-pdf-to-100kb.astro         # NEW
│       ├── compress-pdf-to-200kb.astro         # NEW
│       ├── compress-pdf-to-500kb.astro         # NEW
│       ├── compress-pdf-to-1mb.astro           # NEW
│       └── compress-pdf-to-2mb.astro           # NEW
```

## Step-by-step tasks

1. **Install deps (~5 min):** `npm i @jsquash/jpeg @jsquash/resize`. Add `gs-wasm` (or chosen ghostscript package) but keep import dynamic.
2. **Add `compress-types.ts`:** `CompressOpts`, `CompressResult { originalBytes, compressedBytes, percentSaved, attemptsUsed, fellBackToGs }`.
3. **Create `src/workers/codecs/mozjpeg.ts`:** wraps `@jsquash/jpeg` `encode(imageData, { quality })` and `decode(jpegBytes)`. Initialises the WASM module once with `init()` (lazy).
4. **Create `src/workers/codecs/resize.ts`:** wraps `@jsquash/resize` to scale an `ImageData` by max-side cap, preserving aspect ratio.
5. **Create `src/workers/codecs/ghostscript.ts`:** lazy-imports the ghostscript WASM module; exposes `compressPdf(bytes, preset)` returning `Uint8Array`. The wrapper logs the WASM size when first loaded.
6. **Add the `compress` method to `pdf.worker.ts`:** see the snippets. Pseudocode:
   - Read input from OPFS.
   - Load with pdf-lib; enumerate `doc.context.enumerateIndirectObjects()` to find image XObjects (subtype `/Image`).
   - For each image: decode raw bytes (JPEG vs Flate-encoded PNG-equivalent), re-encode via mozjpeg at target quality, optionally resize first, replace the stream in-place.
   - Save and write to OPFS; return handle + `CompressResult`.
7. **Wrap the above in `compressToTarget`** for size-target mode: binary search `quality ∈ [10, 90]`, max 6 iterations, with a fixed downsample heuristic (max 1500px) baked in. Track best-so-far that is `≤ targetBytes`; if nothing fits, return the smallest produced.
8. **Add automatic ghostscript fallback:** if `compressToTarget` exhausts iterations without hitting the target, optionally re-run via `ghostscript.ts` with `/screen` preset; if still over, surface a "Could not hit target — closest we got was X KB." error to the UI.
9. **Build `CompressTool.svelte`:**
    - Dropzone (single PDF).
    - Tabs: "By Quality" (Low/Medium/High chips) and "By Size" (100 KB / 200 KB / 500 KB / 1 MB / 2 MB chips).
    - Optional "Try harder (slower, loads ~9 MB)" toggle.
    - "Compress" button → progress bar → CompressResult card (orig X MB → compressed Y KB, Z% saved) → "Download" button.
    - Accept a `?target=200kb` URL param to pre-select a preset (used by the per-size landing pages).
10. **Build `/compress-pdf.astro`** — full marketing page (300+ words: how it works, why it's private, presets explained, FAQ schema in Phase 5), tool island.
11. **Build the five size-target pages** as near-identical Astro pages parameterised by content but loading `<CompressTool client:visible targetParam="200kb" />`. Each has bespoke H1 ("Compress PDF to under 200 KB"), 250-word intro tailored to that size (mention common Indian portals at that cap), and unique FAQ entries.
12. **Add cross-links** on each size-target page to the other four ("Need a smaller file? Try 100 KB →"), and on `/compress-pdf` to all five.
13. **Header.astro:** add "Compress" nav entry pointing to `/compress-pdf`.
14. **Configure Vite to handle WASM:** `astro.config.mjs` → `vite: { optimizeDeps: { exclude: ['@jsquash/jpeg', '@jsquash/resize'] } }` so the `.wasm` URLs are emitted correctly. Confirm WASM bytes load with the right MIME (`application/wasm`) under the COEP regime.
15. **SharedArrayBuffer check:** in worker, log `self.crossOriginIsolated` on boot; if `false`, fall back to single-threaded codec (still works, slower). This proves the COOP/COEP headers from Phase 1 are doing their job.
16. **Add bytes-saved telemetry** (optional, privacy-preserving): just a `compressed_pdf` event with the size bucket — never the file. Defer instrumentation to Phase 6 (analytics integration); for now log to console.
17. **Stress test:** compress a 50 MB scanned PDF to 200 KB. Should succeed in <60 seconds on a desktop Chrome. If it OOMs, switch the image-iteration loop to read/write OPFS per page rather than holding the whole `PDFDocument` in memory.
18. **Memory hygiene:** explicitly `null` out large buffers after each image iteration; the worker's heap shouldn't grow per page processed.
19. **Refactor:** abstract the binary-search loop so Phase 4's "compress JPGs before embedding" path can reuse it.
20. **Commit + deploy.** Verify production reads `application/wasm` MIME (Cloudflare Pages handles this automatically). Test on a real Android phone with throttled connection.

## Key code patterns

**`src/workers/codecs/mozjpeg.ts`:**
```ts
import { encode, decode, init } from '@jsquash/jpeg';

let ready: Promise<void> | null = null;
async function ensure() {
  if (!ready) ready = init();
  await ready;
}

export async function jpegEncode(img: ImageData, quality: number): Promise<Uint8Array> {
  await ensure();
  return new Uint8Array(await encode(img, { quality }));
}

export async function jpegDecode(bytes: Uint8Array): Promise<ImageData> {
  await ensure();
  return decode(bytes);
}
```

**`src/workers/codecs/resize.ts`:**
```ts
import resize from '@jsquash/resize';

export async function clampLongestSide(img: ImageData, maxSide: number): Promise<ImageData> {
  const long = Math.max(img.width, img.height);
  if (long <= maxSide) return img;
  const scale = maxSide / long;
  return resize(img, {
    width: Math.round(img.width * scale),
    height: Math.round(img.height * scale),
    method: 'lanczos3',
  });
}
```

**`src/workers/codecs/ghostscript.ts` (lazy):**
```ts
type GsPreset = 'screen' | 'ebook' | 'printer';
let mod: any = null;
export async function compressWithGhostscript(bytes: Uint8Array, preset: GsPreset = 'screen') {
  if (!mod) mod = await import(/* @vite-ignore */ 'gs-wasm');
  const gs = await mod.loadGs();
  const out = await gs.compress(bytes, { preset });
  return out as Uint8Array;
}
```

**`pdf.worker.ts` (added compress method, abbreviated):**
```ts
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { jpegEncode, jpegDecode } from './codecs/mozjpeg';
import { clampLongestSide } from './codecs/resize';
import { compressWithGhostscript } from './codecs/ghostscript';

type Quality = 'low'|'medium'|'high';
const Q_MAP: Record<Quality, { q: number; maxSide: number | null }> = {
  low:    { q: 40, maxSide: 1200 },
  medium: { q: 70, maxSide: 1800 },
  high:   { q: 85, maxSide: null },
};

async function recompressImages(pdfBytes: Uint8Array, q: number, maxSide: number | null) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const objs = doc.context.enumerateIndirectObjects();
  for (const [, obj] of objs) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    if (dict.get(PDFName.of('Subtype'))?.toString() !== '/Image') continue;
    const filter = dict.get(PDFName.of('Filter'))?.toString();
    if (filter !== '/DCTDecode') continue;             // JPEG only for fast path
    const orig = obj.contents;
    try {
      let img = await jpegDecode(orig);
      if (maxSide) img = await clampLongestSide(img, maxSide);
      const re = await jpegEncode(img, q);
      if (re.byteLength < orig.byteLength) {
        // Replace raw contents
        (obj as any).contents = re;
        dict.set(PDFName.of('Width'), doc.context.obj(img.width));
        dict.set(PDFName.of('Height'), doc.context.obj(img.height));
        dict.set(PDFName.of('Length'), doc.context.obj(re.byteLength));
      }
    } catch { /* skip unencodable */ }
  }
  return doc.save({ useObjectStreams: true });
}

async function compressByQuality(bytes: Uint8Array, q: Quality) {
  const { q: jq, maxSide } = Q_MAP[q];
  return recompressImages(bytes, jq, maxSide);
}

async function compressToTarget(bytes: Uint8Array, target: number, onProgress: any) {
  let lo = 10, hi = 90, best: Uint8Array | null = null, attempts = 0;
  while (lo <= hi && attempts < 6) {
    const mid = Math.floor((lo + hi) / 2);
    onProgress(attempts + 1, 6, `Trying quality ${mid}`);
    const out = await recompressImages(bytes, mid, 1500);
    if (out.byteLength <= target) { best = out; lo = mid + 1; } else { hi = mid - 1; }
    attempts++;
  }
  return { out: best ?? await recompressImages(bytes, 10, 1000), attempts };
}

// Attached to PdfApi:
async function compress(h: string, opts: CompressOpts, onProgress: any) {
  const f = await opfs.readFile(h);
  const bytes = new Uint8Array(await f.arrayBuffer());
  const original = bytes.byteLength;
  let out: Uint8Array; let attempts = 0; let fellBackToGs = false;

  if (opts.mode === 'quality') {
    onProgress(0, 1, 'Compressing');
    out = await compressByQuality(bytes, opts.quality!);
  } else {
    const r = await compressToTarget(bytes, opts.targetBytes!, onProgress);
    out = r.out; attempts = r.attempts;
    if (out.byteLength > opts.targetBytes! && opts.gsFallback) {
      onProgress(6, 6, 'Trying Ghostscript fallback (loading 9 MB)…');
      const gs = await compressWithGhostscript(bytes, 'screen');
      if (gs.byteLength < out.byteLength) { out = gs; fellBackToGs = true; }
    }
  }
  const outName = `${crypto.randomUUID()}.pdf`;
  await opfs.writeBytes(outName, out);
  return { handle: outName, result: {
    originalBytes: original, compressedBytes: out.byteLength,
    percentSaved: Math.round((1 - out.byteLength / original) * 100),
    attemptsUsed: attempts, fellBackToGs,
  }};
}
```

**`CompressTool.svelte` (abbreviated):**
```svelte
<script lang="ts">
  import Dropzone from '../Dropzone.svelte';
  import ProgressBar from '../ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  const TARGETS = { '100kb': 100_000, '200kb': 200_000, '500kb': 500_000, '1mb': 1_000_000, '2mb': 2_000_000 };
  let { targetParam = '' } = $props<{ targetParam?: string }>();

  let mode  = $state<'quality'|'targetBytes'>(targetParam ? 'targetBytes' : 'quality');
  let q     = $state<'low'|'medium'|'high'>('medium');
  let tgt   = $state<keyof typeof TARGETS>(targetParam as any || '200kb');
  let gsFb  = $state(false);
  let handle = $state<string|null>(null);
  let progress = $state({ current: 0, total: 1, label: '' });
  let result = $state<any>(null);
  let outHandle = $state<string|null>(null);

  async function onFiles(fs: File[]) { handle = await getPdfClient().stage(fs[0]); result = null; outHandle = null; }
  async function go() {
    const api = getPdfClient();
    const on = Comlink.proxy((c, t, l) => progress = { current: c, total: t, label: l });
    const opts = mode === 'quality' ? { mode, quality: q } : { mode, targetBytes: TARGETS[tgt], gsFallback: gsFb };
    const r = await api.compress(handle!, opts, on);
    outHandle = r.handle; result = r.result;
  }
  async function dl() { downloadBlob(await getPdfClient().getResultBlob(outHandle!), 'compressed.pdf'); }
</script>
```

**`/compress-pdf-to-200kb.astro`:**
```astro
---
import Base from '@/layouts/Base.astro';
import CompressTool from '@/components/tools/CompressTool.svelte';
const title = 'Compress PDF to 200 KB Online — Free, No Upload';
const description = 'Compress any PDF to under 200 KB right in your browser. Perfect for SSC, Railway, and college portal uploads. No upload, no signup, no watermark.';
---
<Base {title} {description}>
  <h1>Compress PDF to under 200 KB</h1>
  <p>Many Indian government portals (SSC CGL, Railway RRB, state college admission forms) cap PDF uploads at 200 KB. This tool runs entirely in your browser — your file never leaves your device — and uses iterative re-encoding to hit exactly that target.</p>
  <CompressTool client:visible targetParam="200kb" />
</Base>
```

## Gotchas (from research)
- **`pdf-lib` does NOT recompress embedded images** by itself — you have to extract, re-encode, and replace each `/Image` XObject manually (research §6, Approach A). This is the bulk of the implementation work.
- **Image XObjects come in two flavours:** `/DCTDecode` (already JPEG — we re-encode), and `/FlateDecode` (PNG-like, often scanned book pages that have transparency or alpha). Phase 3 handles `/DCTDecode` only for simplicity; document Flate as "future work" or fall to Ghostscript.
- **Quality 10 + 1000 px clamp can still miss a 100 KB target** on a 20-page text-heavy PDF (because text and fonts have a floor). Always surface "could not hit target — closest was X KB" instead of silently shipping an over-target file.
- **`@jsquash/jpeg` init() is async and 100 ms+** — call it eagerly when the user first lands on `/compress-pdf` (in the tool's `onMount`) to hide the latency behind their thinking time.
- **Ghostscript WASM is ~9 MB.** Lazy-import it. Cloudflare Pages free tier per-asset cap is 25 MB — fine, but chunk it. Loading on every compress is wasteful.
- **`SharedArrayBuffer` requires `crossOriginIsolated === true`** which requires COOP/COEP headers (set in Phase 1's `_headers`). If those got removed, threaded codec builds silently fall back to single-thread and you'll wonder why compression is 4× slower than expected.
- **`pdf-lib`'s `enumerateIndirectObjects()` returns an array of `[PDFRef, PDFObject]` tuples** — TypeScript types are lax. Always `instanceof PDFRawStream` check before touching `.contents`.
- **Replacing `obj.contents` directly is technically reaching into pdf-lib internals.** It works in 1.17.x; pin the version to avoid surprise breakage on a future upgrade. There is a github issue thread (`pdf-lib#1027`) discussing a proper API but it's not merged as of 2026.
- **OOM risk on giant scanned PDFs.** A 200-page scanned PDF at 300 DPI is ~200 MB of decoded ImageData held in worker heap if you decode them all at once. Stream: decode page → re-encode → replace → null the ImageData → next.
- **Result PDF size depends on object streams** — pass `{ useObjectStreams: true }` to `doc.save()` for another ~5–10% reduction free.
- **iOS Safari has historically failed at WASM threading.** Test on Safari iOS; if threaded build crashes, ship the non-threaded build there via UA sniff (acceptable trade-off).
- **The "try harder" toggle UX:** never make it default — it forces a 9 MB download on every user. Frame it as "If the result isn't small enough, click Try Harder (downloads extra ~9 MB)."
- **PDF→Word remains explicitly out-of-scope.** LibreOffice WASM still isn't stable in 2026 (research §2). If you find yourself reaching for it, stop.

## Verification (manual test checklist)
1. Drop a 5 MB scanned PDF on `/compress-pdf`. Select Medium quality. Click Compress. Result < 2 MB, opens fine.
2. Same PDF, select 200 KB target. Result ≤ 200 KB or clear "couldn't hit it" message; opens fine.
3. Same PDF, select 100 KB target with Ghostscript fallback toggle on. Acceptable if result is 100–150 KB after gs fallback.
4. Try a text-only 1 MB PDF (e.g., a vector resume). 200 KB target should either succeed via downsampling-of-nothing (small saving) or honestly say "already this small."
5. Test a 50 MB scanned book PDF on Medium quality. Completes within ~90 seconds on desktop. Worker heap (DevTools Memory) stays under 1 GB.
6. Visit `/compress-pdf-to-200kb`. Compress preset already on "200 KB". Compress → result under 200 KB.
7. Visit other size-target pages — each has unique H1, unique intro, all preset chips work.
8. DevTools Network during compression: zero outbound calls (the wedge holds).
9. DevTools Performance: main thread stays responsive (no >50 ms blocks) — all work in worker.
10. Lighthouse mobile on `/compress-pdf` ≥ 95.
11. Real Android phone: compress a phone-camera scan to 200 KB. Completes within ~45 seconds, no crash.
12. View-source on each size-target landing page: meta title, description, canonical, JSON-LD `SoftwareApplication` are all present.
13. Test with `crossOriginIsolated` disabled (manually remove COOP/COEP from `_headers` temporarily) — confirm fallback path still works (slower but correct).
14. Check that mozjpeg WASM is cached after first compress (Network → Disable cache off; second compress reuses cached `.wasm`).

## Definition of "ship-ready"
- `/compress-pdf` and all five size-target pages live in production.
- A real Indian govt-form-style PDF (e.g., scanned mark sheet) hits the 200 KB cap in under 30 seconds on a mid-range Android.
- README's "Architecture" section updated to mention the compression pipeline (image extract → mozjpeg re-encode → binary search → optional gs fallback). This is the second-strongest interview talking point after Workers+OPFS.
- Network tab zero-leak verified on production URL.
- All 7 tool routes (the 6 from Phases 1–2 plus `/compress-pdf`) Lighthouse mobile ≥ 95.

## References
- Research doc: `../research.md` §6 (Approaches A/B/C for compression — the section this phase implements directly), §1 (India size-cap context), §3 (gap analysis vs SmallPDF/iLovePDF).
- `@jsquash/jpeg`: https://github.com/jamsinclair/jSquash/tree/main/packages/jpeg
- `@jsquash/resize`: https://github.com/jamsinclair/jSquash/tree/main/packages/resize
- Ghostscript WASM: https://github.com/laurentmmeyer/ghostscript-pdf-compress.wasm
- `pdf-lib` internals (image XObjects): https://github.com/Hopding/pdf-lib/issues/1027
- SharedArrayBuffer + COOP/COEP: https://web.dev/articles/coop-coep
- `crossOriginIsolated`: https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated
