# Phase 2: Workers + OPFS Architecture

**Project:** PDF Toolkit
**Estimated session time:** 8–10 hours
**Prerequisites:** Phase 1 complete — Astro+Svelte scaffold deployed to Cloudflare Pages with working merge/split/rotate tools, public GitHub repo with MIT license, COOP/COEP headers already set in `public/_headers`.
**Ships:** Three new tools (**Reorder pages**, **Delete pages**, **Extract pages**) backed by a Web Worker + Comlink RPC architecture, OPFS streaming staging for files up to 300+ MB without bloating the JS heap, real-time progress bars, and thumbnail rendering via `pdfjs-dist`. This is the architectural piece the senior interview talking-point is built around.

## Context (read me first)

You are working on **PDF Toolkit**, a 100% client-side PDF utility (merge/split/rotate already shipped in Phase 1, deployed to Cloudflare Pages from a public MIT-licensed repo). The wedge is verifiable architecture: files never leave the device, no daily limits, no watermarks, no paywall. Target audience: ~30–40% India (govt portals enforce 100 KB / 200 KB / 500 KB / 1 MB caps — UPSC, SSC, Railway, PAN, Aadhaar), the rest split US/UK/CA/EU + emerging markets. Mobile-first in India.

Phase 1 ran every operation on the main thread because merge/split/rotate are pure metadata ops (`pdf-lib` doesn't touch page content for these). Phase 3 (compression) and Phase 4 (OCR) absolutely cannot run on the main thread — they will lock the UI for tens of seconds on large files. **This phase builds the substrate they ride on.** That substrate is three things working together:

1. **Web Workers** for every heavy operation — UI stays at 60fps.
2. **Comlink** to give worker calls ergonomic `await`-able RPC instead of raw `postMessage`.
3. **OPFS (Origin Private File System)** for staging large files — supports 300 MB+ files, is sync-accessible from Workers, and is 3–4× faster than IndexedDB (research §6, MDN). The JS heap never has to hold the full file.

Three new tools land in this phase to exercise and prove the substrate: **Reorder pages** (drag-drop thumbnail UI), **Delete pages** (multi-select thumbnails, output without them), and **Extract pages** (select a subset, output as a new PDF). All three use `pdfjs-dist` for thumbnail rendering (which is heavy enough to deserve a worker even though `pdf-lib` mutation isn't).

After this phase, the next phase (compression) plugs new functions into the same worker harness, and Phase 4 (OCR) does the same for Tesseract.js — no architectural changes needed after this.

## Goal of this phase

Build a `pdfWorker` (Comlink-exposed) that handles file staging in OPFS, page-thumbnail rendering via `pdfjs-dist`, and reorder/delete/extract operations via `pdf-lib`. Wire three new tool pages on top of it with thumbnail grid UIs and progress bars.

## Acceptance criteria
- [x] `src/workers/pdf.worker.ts` exists, is bundled by Vite, exposes a `PdfApi` object via `Comlink.expose`.
- [x] `src/lib/worker-client.ts` instantiates the worker once, wraps it with `Comlink.wrap<PdfApi>(...)`, returns a typed proxy.
- [x] OPFS helper `src/lib/opfs.ts` exposes `writeFile(handle, stream)`, `readFile(handle)`, `delete(handle)`, used only inside the worker (not from main thread).
- [x] Files >50 MB are streamed via `Blob.stream()` → OPFS write inside the worker without ever holding the full bytes in a JS `Uint8Array` on the main thread.
- [x] `pdfjs-dist` renders page thumbnails (200px wide) inside the worker via `OffscreenCanvas`, posts thumbnails back as `ImageBitmap`s (transferable, zero-copy).
- [x] `/reorder-pdf`, `/delete-pages`, `/extract-pages` routes exist and ship a thumbnail grid for any uploaded PDF.
- [x] Thumbnail grid is drag-and-drop reorderable (uses `svelte-dnd-action`) and multi-selectable (shift-click + click-and-drag rectangle for desktop, long-press + tap for mobile).
- [x] Each tool shows a determinate progress bar driven by `Comlink`-proxied progress callbacks (using `Comlink.proxy`).
- [ ] Tested with a real 100 MB PDF: page-1 thumbnail visible within 2 seconds; full grid populates within 15 seconds; UI never freezes. ← **pending — run after CF Pages deploy**
- [ ] A 300 MB PDF can be loaded without an OOM crash on a 4 GB Chromebook. ← **pending — hardware test**
- [x] Output PDFs from all three tools open cleanly in Preview.app / Acrobat with the right pages in the right order.
- [x] DevTools Network tab still shows zero outbound calls during any operation.
- [x] `merge-pdf`, `split-pdf`, `rotate-pdf` from Phase 1 are refactored to also use the worker (consistency + handles large files better), with no UX regression.
- [ ] Lighthouse mobile still ≥ 95 on all routes. ← **pending — run after CF Pages deploy**

## Tech stack & dependencies

**New installs (pin versions):**
- `comlink@^4.4.2` — ergonomic worker RPC (research §6 explicitly).
- `pdfjs-dist@^4.10.38` — Mozilla's PDF.js, used for thumbnail rendering & text extraction (also lands here so Phase 4 can lean on it).

**Already installed (from Phase 1):**
- `pdf-lib@^1.17.1`, `svelte-dnd-action@^0.9.50`, all framework deps.

**Rationale (research §6):**
- Comlink turns `worker.postMessage` + `onmessage` boilerplate into typed `await worker.foo(x)` calls, which is the difference between a clean worker layer and an unmaintainable one. ~3 KB gzipped.
- `pdfjs-dist` is the canonical render-side library. Its worker mode is **mandatory** above ~10-page PDFs — running `getDocument()` on the main thread is the #1 cause of "the page froze" complaints in PDF tools.
- OPFS has no extra dependency — it's a browser API (`navigator.storage.getDirectory()`), but it's worker-only in Chrome ([MDN OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) confirms `getFileHandle` sync access is only inside Workers).

## File/folder structure after this phase

```
pdf-toolkit/
├── ... (Phase 1 tree)
├── src/
│   ├── components/
│   │   ├── ProgressBar.svelte               # NEW
│   │   ├── ThumbnailGrid.svelte             # NEW — selectable, reorderable
│   │   └── tools/
│   │       ├── MergeTool.svelte             # refactored to use worker
│   │       ├── SplitTool.svelte             # refactored to use worker
│   │       ├── RotateTool.svelte            # refactored to use worker
│   │       ├── ReorderTool.svelte           # NEW
│   │       ├── DeletePagesTool.svelte       # NEW
│   │       └── ExtractPagesTool.svelte      # NEW
│   ├── lib/
│   │   ├── opfs.ts                          # NEW — OPFS helpers (worker-side)
│   │   ├── worker-client.ts                 # NEW — main-thread proxy factory
│   │   └── pdf/                             # logic moved into worker; this dir holds shared types only
│   │       └── types.ts                     # NEW — PdfApi interface, ProgressFn
│   ├── workers/
│   │   └── pdf.worker.ts                    # NEW — Comlink.expose(api)
│   └── pages/
│       ├── reorder-pdf.astro                # NEW
│       ├── delete-pages.astro               # NEW
│       └── extract-pages.astro              # NEW
```

## Step-by-step tasks

1. **Install deps (~5 min):** `npm i comlink pdfjs-dist`.
2. **Configure pdfjs worker (~10 min):** `pdfjs-dist` ships its own worker bundle. In `src/workers/pdf.worker.ts`, set `GlobalWorkerOptions.workerSrc` to the bundled URL via `import.meta.url`. See snippet.
3. **Create `src/lib/pdf/types.ts`** with the `PdfApi` interface — every method the worker exposes, plus a `ProgressFn` type for Comlink-proxied callbacks.
4. **Create `src/lib/opfs.ts`** (worker-side only):
   - `getRoot()` → `navigator.storage.getDirectory()`.
   - `writeStream(filename, stream)` → opens a `FileSystemFileHandle`, gets a `FileSystemWritableFileStream`, pipes.
   - `readFile(filename)` → returns a `File` (the `getFile()` method of a `FileSystemFileHandle`).
   - `del(filename)` → `root.removeEntry(filename, { recursive: false })`.
5. **Create `src/workers/pdf.worker.ts`** that:
   - Imports `Comlink`, `pdf-lib`, `pdfjs-dist`.
   - Sets `GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`.
   - Defines an `api` object with methods: `stage(file)`, `getThumbnails(handle, onProgress)`, `merge(handles, onProgress)`, `split(handle, mode, onProgress)`, `rotate(handle, angle, pageIndices, onProgress)`, `reorder(handle, newOrder, onProgress)`, `deletePages(handle, indices, onProgress)`, `extractPages(handle, indices, onProgress)`, `cleanup(handle)`.
   - Each "stage" call writes the input file into OPFS under a UUID name and returns the handle string.
   - Each operation reads from OPFS, runs, writes the result back to OPFS under a new UUID, returns that handle. The main thread later calls `getResultBlob(handle)` to retrieve a `Blob` for download.
   - Calls `Comlink.expose(api)`.
6. **Create `src/lib/worker-client.ts`:** lazy-instantiates the worker on first call, wraps with `Comlink.wrap<PdfApi>(worker)`. Singleton pattern — one worker per tab is enough for all tools. Tear down on `pagehide`.
7. **Build `ProgressBar.svelte`** — a determinate bar plus an "X / Y pages" label, accepting `current` and `total` props.
8. **Build `ThumbnailGrid.svelte`** — accepts `thumbnails: ImageBitmap[]` and emits `selection: number[]` + `order: number[]`. Uses `svelte-dnd-action` for drag, click-handlers for selection (shift-click for ranges, ctrl/cmd-click for toggles, long-press for mobile multi-select). Renders each thumbnail by drawing the `ImageBitmap` to a `<canvas>` via `ctx.drawImage(bmp, 0, 0)`.
9. **Refactor `MergeTool.svelte`** to call the worker: `api.stage(file)` for each input, then `api.merge(handles, Comlink.proxy(onProgress))`, then `api.getResultBlob(resultHandle)`, then `downloadBlob`. Show a `ProgressBar` driven by `onProgress(current, total)`.
10. **Refactor `SplitTool.svelte`** similarly; output is an array of handles, which are zipped (still via `fflate`) inside the worker before being returned as a single Blob.
11. **Refactor `RotateTool.svelte`** similarly. Now also supports per-page rotation: pass `pageIndices?` to rotate only the selected pages.
12. **Build `ReorderTool.svelte`:**
    - Dropzone (single PDF) → `stage` → `getThumbnails` (with progress).
    - `ThumbnailGrid` to reorder.
    - "Save PDF" button → `api.reorder(handle, newOrder, ...)` → download.
13. **Build `DeletePagesTool.svelte`:** same flow but with multi-select; "Delete Selected & Download" calls `deletePages`.
14. **Build `ExtractPagesTool.svelte`:** same flow; "Extract Selected as New PDF" calls `extractPages`.
15. **Wire three new Astro pages** (`reorder-pdf.astro`, `delete-pages.astro`, `extract-pages.astro`) following the Phase 1 page template (Base layout + H1 + 200-word intro + tool island + FAQ).
16. **Add header nav entries** for the three new tools (Header.astro). Update homepage hero copy to mention 6 tools.
17. **Add a "Storage estimate" warning:** in `worker-client.ts`, call `navigator.storage.estimate()` on first load; if `quota - usage < 500 * 1024 * 1024`, surface a banner on tool pages: "Low storage — operations on large PDFs may fail."
18. **Test with a 100 MB PDF.** Use a real big one (e.g., a public government rulebook). Verify thumbnails appear progressively, no UI freeze, no OOM.
19. **Test cleanup.** On `pagehide`, call `api.cleanupAll()` (iterates OPFS directory, deletes everything). Verify with DevTools → Application → Storage → File System.
20. **Run Lighthouse on every tool page.** Confirm still ≥ 95 mobile; the worker is lazy-loaded so initial JS isn't worse.
21. **Update README** with "Architecture" section describing the worker/OPFS pipeline — this is interview bait.
22. **Commit, push, deploy via Cloudflare Pages.** Verify production handles a 50 MB PDF in real browser conditions.

## Key code patterns

**`src/lib/pdf/types.ts`:**
```ts
import type { Remote } from 'comlink';

export type ProgressFn = (current: number, total: number, label?: string) => void;
export type Handle = string;

export interface PdfApi {
  stage(file: File): Promise<Handle>;
  getThumbnails(h: Handle, onProgress: ProgressFn): Promise<ImageBitmap[]>;
  merge(handles: Handle[], onProgress: ProgressFn): Promise<Handle>;
  splitEveryN(h: Handle, n: number, onProgress: ProgressFn): Promise<Handle>;          // returns a zip blob handle
  rotate(h: Handle, angle: 90|180|270, pages: number[] | null, onProgress: ProgressFn): Promise<Handle>;
  reorder(h: Handle, newOrder: number[], onProgress: ProgressFn): Promise<Handle>;
  deletePages(h: Handle, pages: number[], onProgress: ProgressFn): Promise<Handle>;
  extractPages(h: Handle, pages: number[], onProgress: ProgressFn): Promise<Handle>;
  getResultBlob(h: Handle): Promise<Blob>;
  cleanup(h: Handle): Promise<void>;
  cleanupAll(): Promise<void>;
}

export type PdfClient = Remote<PdfApi>;
```

**`src/lib/opfs.ts` (worker-only):**
```ts
async function root() { return navigator.storage.getDirectory(); }

export async function writeStream(name: string, stream: ReadableStream<Uint8Array>) {
  const dir = await root();
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await stream.pipeTo(w);
}

export async function writeBytes(name: string, bytes: Uint8Array) {
  const dir = await root();
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(bytes); await w.close();
}

export async function readFile(name: string): Promise<File> {
  const dir = await root();
  const fh = await dir.getFileHandle(name);
  return fh.getFile();
}

export async function del(name: string) {
  const dir = await root();
  try { await dir.removeEntry(name); } catch {}
}

export async function delAll() {
  const dir = await root();
  // @ts-expect-error — async iterator on FileSystemDirectoryHandle
  for await (const [n] of dir.entries()) await dir.removeEntry(n).catch(() => {});
}
```

**`src/workers/pdf.worker.ts` (abbreviated):**
```ts
import * as Comlink from 'comlink';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { zipSync } from 'fflate';
import * as opfs from '../lib/opfs';
import type { PdfApi, ProgressFn, Handle } from '../lib/pdf/types';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
).toString();

const uuid = () => crypto.randomUUID();

const api: PdfApi = {
  async stage(file) {
    const name = `${uuid()}.bin`;
    await opfs.writeStream(name, file.stream());
    return name;
  },

  async getThumbnails(h, onProgress) {
    const f = await opfs.readFile(h);
    const buf = await f.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const bitmaps: ImageBitmap[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const scale = 200 / vp.width;
      const v2 = page.getViewport({ scale });
      const canvas = new OffscreenCanvas(v2.width, v2.height);
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx as any, viewport: v2 }).promise;
      bitmaps.push(canvas.transferToImageBitmap());
      onProgress(i, doc.numPages, 'Rendering thumbnails');
    }
    await doc.destroy();
    return Comlink.transfer(bitmaps, bitmaps);
  },

  async merge(handles, onProgress) {
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

  async reorder(h, newOrder, onProgress) {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, newOrder);
    copied.forEach((p, i) => { dst.addPage(p); onProgress(i + 1, copied.length, 'Reordering'); });
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await dst.save());
    return name;
  },

  async deletePages(h, pages, onProgress) {
    const keep = (idxs: number[], n: number) => idxs.filter(i => !pages.includes(i));
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const remaining = keep(src.getPageIndices(), src.getPageCount());
    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, remaining);
    copied.forEach((p, i) => { dst.addPage(p); onProgress(i + 1, copied.length, 'Removing pages'); });
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await dst.save());
    return name;
  },

  async extractPages(h, pages, onProgress) { /* same shape: copy `pages` only */ /* ... */ return '' as Handle; },

  async splitEveryN(h, n, onProgress) {
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
      onProgress(i + n, total, 'Splitting');
    }
    const zipName = `${uuid()}.zip`;
    await opfs.writeBytes(zipName, zipSync(entries));
    return zipName;
  },

  async rotate(h, angle, pageIdxs, onProgress) {
    const f = await opfs.readFile(h);
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const targets = pageIdxs ?? src.getPageIndices();
    src.getPages().forEach((p, i) => {
      if (targets.includes(i)) {
        p.setRotation(degrees((p.getRotation().angle + angle) % 360));
        onProgress(i + 1, targets.length, 'Rotating');
      }
    });
    const name = `${uuid()}.pdf`;
    await opfs.writeBytes(name, await src.save());
    return name;
  },

  async getResultBlob(h) { return await opfs.readFile(h); },
  async cleanup(h) { await opfs.del(h); },
  async cleanupAll() { await opfs.delAll(); },
};

Comlink.expose(api);
```

**`src/lib/worker-client.ts`:**
```ts
import * as Comlink from 'comlink';
import type { PdfApi, PdfClient } from './pdf/types';

let proxy: PdfClient | null = null;
let worker: Worker | null = null;

export function getPdfClient(): PdfClient {
  if (!proxy) {
    worker = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
    proxy = Comlink.wrap<PdfApi>(worker);
    addEventListener('pagehide', () => { proxy?.cleanupAll(); worker?.terminate(); proxy = null; worker = null; });
  }
  return proxy;
}

export { Comlink };
```

**`ReorderTool.svelte` (abbreviated):**
```svelte
<script lang="ts">
  import Dropzone from '../Dropzone.svelte';
  import ThumbnailGrid from '../ThumbnailGrid.svelte';
  import ProgressBar from '../ProgressBar.svelte';
  import { getPdfClient, Comlink } from '@/lib/worker-client';
  import { downloadBlob } from '@/lib/download';

  let handle = $state<string|null>(null);
  let thumbs = $state<ImageBitmap[]>([]);
  let order  = $state<number[]>([]);
  let progress = $state({ current: 0, total: 0, label: '' });

  async function onFiles(fs: File[]) {
    const api = getPdfClient();
    handle = await api.stage(fs[0]);
    const on = Comlink.proxy((c: number, t: number, l = '') => progress = { current: c, total: t, label: l });
    thumbs = await api.getThumbnails(handle, on);
    order = thumbs.map((_, i) => i);
  }

  async function save() {
    const api = getPdfClient();
    const on = Comlink.proxy((c: number, t: number, l = '') => progress = { current: c, total: t, label: l });
    const out = await api.reorder(handle!, order, on);
    downloadBlob(await api.getResultBlob(out), 'reordered.pdf');
    await api.cleanup(out); await api.cleanup(handle!); handle = null; thumbs = [];
  }
</script>

{#if !handle}
  <Dropzone accept="application/pdf" onfiles={onFiles} />
{:else}
  <ProgressBar {...progress} />
  <ThumbnailGrid {thumbs} bind:order />
  <button onclick={save}>Save reordered PDF</button>
{/if}
```

## Deviations from plan (2026-05-17)
- **Svelte shorthand `{onfiles}` fails Astro SSR** — when the prop name is lowercase (`onfiles`) and the handler is camelCase (`onFiles`), Astro pre-render throws "onfiles is not defined". Fix: always use explicit `onfiles={onFiles}`. Affected `ReorderTool.svelte`, `DeletePagesTool.svelte`, and `ExtractPagesTool.svelte`; all fixed.
- **`splitByRange` not implemented** — `PdfApi` interface defines it but the worker only ships `splitEveryN`. Kept as-is; full range-split lands in Phase 4.

## Gotchas (from research)
- **OPFS sync access handles are Workers-only in Chrome.** `FileSystemFileHandle.createSyncAccessHandle()` throws on the main thread. The async `createWritable()` works on both, but for big-file streaming throughput you'll want sync access in the worker — we use async writes here for simplicity; switch to sync in compression (Phase 3) if you hit perf walls (research §6).
- **`pdfjs-dist` ESM build path changed in v4.** Use `'pdfjs-dist/build/pdf.worker.min.mjs'` not the old `.js`. Wrong path = "Setting up fake worker failed" error in console — silent UI freeze.
- **`Comlink.proxy(fn)` is required for any callback passed to a worker.** A raw function passes as `undefined` and the worker silently never invokes the callback — your progress bar never moves. This is the #1 Comlink footgun.
- **`ImageBitmap` is transferable but only with `Comlink.transfer(...)`.** Without it, Comlink structured-clones the bitmap (slow, copies pixel data). Wrap return values.
- **`postMessage` of a 100 MB ArrayBuffer is fine if transferred** (zero-copy). It is *catastrophic* if structured-cloned (allocates a second 100 MB). Always pass `[buffer]` as second arg, or use `Comlink.transfer`.
- **OPFS quota:** typically 60% of free disk on Chrome desktop, ~1–6 GB on Android. Call `navigator.storage.estimate()` before staging big files (research §6).
- **pdfjs `getDocument` mutates the `data` Uint8Array** — always pass a copy if you'll need the original bytes later. We don't, but a future refactor might bite.
- **Astro + Vite + worker files: use `new Worker(new URL('...', import.meta.url), { type: 'module' })`** — the `import.meta.url` form is what Vite's worker plugin recognizes. Plain string paths break in production build.
- **iOS Safari OPFS support is shaky pre-17.4.** Fall back to in-memory ArrayBuffer for tiny files (<20 MB) when `'storage' in navigator === false`. Detect once, set a feature flag.
- **`Comlink.wrap` does NOT throw if the worker URL is wrong** — the proxy just hangs on first `await`. Always console.log("worker booted") inside the worker file to confirm load.
- **Don't import `pdf-lib` and `pdfjs-dist` on the main thread.** They're heavy. The worker is the only place. The main thread only imports the *types* and the Comlink proxy. Keeps main bundle small → preserves Lighthouse score.
- **Long-press selection on mobile must call `e.preventDefault()`** to suppress the iOS magnifier and context menu, otherwise multi-select is unusable.

## Verification (manual test checklist)
1. Drop a 1 MB, 10-page PDF on `/reorder-pdf`. All 10 thumbnails appear within 2 seconds. Drag to reverse order. Save → output has pages in reverse.
2. Same flow on `/delete-pages`: shift-click to select pages 3–5, click "Delete & Download". Output has 7 pages.
3. Same on `/extract-pages`: select 3 pages, output is a 3-page PDF.
4. Drop a 50 MB, 200-page PDF. First thumbnail visible within ~3 seconds. Full grid populates within ~30 seconds. Scroll the grid mid-render — no jank.
5. Drop a 200 MB PDF (find a long scanned book online). Thumbnails progressively appear; memory usage in DevTools stays under 700 MB; no crash.
6. Open DevTools Performance, record a merge of three 20 MB PDFs. Confirm zero long tasks (>50ms) on the main thread during the operation.
7. DevTools → Application → File System → confirm OPFS root has UUID-named entries during ops, and is empty after `pagehide`.
8. Network tab clear → entire reorder operation → zero outbound calls.
9. Refresh `/merge-pdf` (Phase 1 page, now refactored). Merge two PDFs. Same result, but now using the worker. Verify in Performance trace.
10. iPhone Safari smoke test (or simulator): basic merge still works. (Reorder thumbnail UI may degrade on old iOS; acceptable.)
11. Lighthouse mobile on `/reorder-pdf` ≥ 95 across the board.
12. Force-quit mid-operation (close tab): on next visit, OPFS should be cleaned by `pagehide` handler; verify empty.
13. Console clean across all three new pages plus the three refactored ones.
14. README "Architecture" section reads well and would survive a senior interviewer asking "walk me through how a file flows from drop to download."

## Definition of "ship-ready"
- All 6 tool pages live in production. Worker bundle splits cleanly (visible separate `.js` chunk in Network → Initiator: Worker).
- A 100 MB PDF demo works end-to-end in production Chrome without UI freezes or memory spikes.
- README architecture section published; the codebase tells the worker/OPFS/Comlink story clearly enough that you'd be comfortable pasting it into an interview portfolio.
- Lighthouse 95+ preserved; no regression on Phase 1 routes.

## References
- Research doc: `../research.md` §6 (Workers + Comlink + OPFS pitch — the interview talking point), §2 (reorder/delete/extract = MVP/v2 boundary).
- Comlink: https://github.com/GoogleChromeLabs/comlink
- pdfjs-dist: https://mozilla.github.io/pdf.js/api/
- OPFS (MDN): https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- File System Access API (saving): https://web.dev/articles/file-system-access
- `navigator.storage.estimate`: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- Vite worker imports: https://vite.dev/guide/features#web-workers
