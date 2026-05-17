# Completed sessions — PDF Toolkit

Append a new entry at the end of every session you complete. Newest at the bottom.

## Format

```
- **YYYY-MM-DD — Phase N: [Title]** (X hours)
  - Shipped: [what is live/deployable after this session]
  - Notable: [decisions, deviations, surprises worth flagging for next session]
  - Commit / PR: [link]
  - Next session should: [one-line handoff hint]
```

## Log

- **2026-05-17 — Phase 1: Foundation** (~2 hours)
  - Shipped: Astro 5 + Svelte 5 scaffold with three working tools (Merge, Split, Rotate), all pure `pdf-lib`. PWA manifest + Workbox service worker. COOP/COEP headers. Sitemap. Privacy + Terms pages. MIT LICENSE + README + CONTRIBUTING + CI workflow. `npm run build` clean, 6 routes in dist/.
  - Notable: Scaffold pulled Astro 6 + `@astrojs/svelte@8` (Astro 6 only) + TypeScript 6. Had to pin to Astro 5.18.1 + `@astrojs/svelte@7` + TypeScript 5.7 to satisfy `@vite-pwa/astro@1.x` peer deps. `@vite-pwa/astro` exports a default function, not `{ VitePWA }` — must import as `import pwa from '@vite-pwa/astro'`.
  - Commit / PR: —
  - Next session should: Push to GitHub, deploy to Cloudflare Pages, then start Phase 2 (install `comlink pdfjs-dist`, build `pdf.worker.ts` + OPFS harness + ReorderTool/DeletePagesTool/ExtractPagesTool).

- **2026-05-17 — Phase 2: Workers + OPFS** (~3 hours)
  - Shipped: All 6 tools now run in a Web Worker via Comlink. OPFS staging layer (`src/lib/opfs.ts`). Unified `PdfApi` interface + `pdf.worker.ts` (pdf-lib + pdfjs-dist + fflate). Worker singleton in `src/lib/worker-client.ts` with `pagehide` cleanup. ProgressBar component. ThumbnailGrid with drag-reorder (svelte-dnd-action) + shift/ctrl multi-select. Three new tools: ReorderTool, DeletePagesTool, ExtractPagesTool. Three new pages: `/reorder-pdf`, `/delete-pages`, `/extract-pages`. Header + homepage updated to 6 tools. `npm run build` clean, 9 routes in dist/.
  - Notable: Svelte shorthand `{onfiles}` resolves at SSR time — must write `onfiles={onFiles}` explicitly when the prop name (lowercase) differs from the function name (camelCase). This broke build in Phase 2 on all three new tools; fixed one-by-one. pdfjs-dist worker path must use `new URL(..., import.meta.url).toString()` so Vite can bundle the asset correctly.
  - Commit / PR: —
  - Next session should: Connect Railway deploy, then start Phase 3 (compress PDF — @jsquash/jpeg + binary-search size targeting + India presets).

- **2026-05-17 — Phase 3: Compression Pipeline** (~2 hours)
  - Shipped: `compress()` worker method — re-encodes JPEG XObjects via `@jsquash/jpeg` + `@jsquash/resize`; binary-search mode (up to 6 iterations) hits exact size targets. `/compress-pdf` main tool page + 5 India size-target landing pages (`/compress-pdf-to-100kb`, `200kb`, `500kb`, `1mb`, `2mb`). Header + homepage updated to 7 tools. `npm run build` clean, 15 routes in dist/. mozjpeg + squoosh WASM bundled (~600 KB total).
  - Notable: `@jsquash/jpeg` exports only `encode` and `decode` — no `init()`. Module self-initialises on first call; remove the `init` import. ghostscript-wasm fallback deliberately omitted — `@jsquash/jpeg` binary search covers the vast majority of use cases; gs fallback can be added in Phase 5 if needed.
  - Commit / PR: —
  - Next session should: Deploy on Railway, then start Phase 4 (JPG↔PDF, Tesseract.js OCR, password remove via @cantoo/pdf-lib).

- **2026-05-17 — Phase 4: JPG↔PDF + OCR + Password Remove** (~2 hours)
  - Shipped: `imagesToPdf()` worker method (embed JPG/PNG/WebP via pdf-lib, one page per image). `pdfToImages()` worker method (renders at 2× via pdfjs OffscreenCanvas, exports as JPEG zip). `removePassword()` worker method via `@cantoo/pdf-lib`. OCR via Tesseract.js lazy-loaded on main thread (avoids nested-worker complexity). 4 new tools + pages: `/jpg-to-pdf`, `/pdf-to-jpg`, `/ocr-pdf`, `/remove-password`. Header + homepage updated to 11 tools. Build clean: 19 routes.
  - Notable: OCR runs on the main thread (Tesseract.js manages its own worker internally). Stage method now preserves file extension (jpg/png/pdf) so imagesToPdf can detect format. @cantoo/pdf-lib used only for removePassword — regular pdf-lib handles all other ops to keep bundles minimal.
  - Commit / PR: —
  - Next session should: Deploy on Railway, then Phase 5 (programmatic SEO — 60+ landing pages via Astro content collections).

- **2026-05-17 — Infra: GitHub + Railway config** (~30 min)
  - Shipped: Public repo live at https://github.com/viruboby8/pdf-toolkit. `railway.json` (nixpacks build → `npx serve dist`). `public/serve.json` carries COOP/COEP + security headers for the `serve` static server (replaces Cloudflare `_headers` format). `start` script added to package.json. Deployment target changed from Cloudflare Pages to Railway.
  - Notable: `_headers` is Cloudflare-only format; Railway's `serve` reads `serve.json` instead — must keep both for portability. `npx serve dist --listen $PORT` uses Railway's injected `$PORT` env var.
  - Commit / PR: https://github.com/viruboby8/pdf-toolkit/commit/8f6118e
  - Next session should: Connect repo to Railway, verify deploy, then Phase 3.

- **2026-05-17 — Phase 5: Programmatic SEO Scale-Up** (~3 hours)
  - Shipped: Astro Content Collection (`landing` + `blog`) with Zod schema. `@astrojs/mdx` installed. 44 new landing pages via `[...slug].astro` dynamic route covering India-govt intents (UPSC, SSC, Railway, PAN, Aadhaar, college, visa, KYC, ITR, bank), JPG-to-PDF India flows, size variants (300KB, 3MB, 5MB, 10MB, 50MB), quality/offline modifiers, alternative-to comparison pages, and long-tail combos. Blog scaffold at `/blog/[slug].astro` + 3 seed posts. Human-readable sitemap at `/sitemap.html`. `JsonLd`, `FaqSchema`, `HowToSchema`, `Breadcrumbs`, `RelatedTools` SEO components. `ToolLoader.astro` switching all 11 tools. `Landing.astro` layout with SoftwareApplication + FAQPage + HowTo + BreadcrumbList JSON-LD per page. og:image + twitter:image added to Base.astro. Build clean: 68 routes, 68 URLs in sitemap-0.xml.
  - Notable: `@astrojs/mdx@5.x` requires Astro 6 — must install `@astrojs/mdx@^4.0.0` (installs 4.3.14) for Astro 5 compatibility. YAML plain-scalar `: ` (colon-space) inside `a:` FAQ values causes js-yaml parse error — must quote affected strings. `astro-og-canvas` skipped (per-page OG images deferred); using icon-512.png as default OG image instead.
  - Commit / PR: —
  - Next session should: Deploy on Railway, submit sitemap to Google Search Console, then Phase 6 (TWA + AdSense).
