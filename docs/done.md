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
  - Next session should: Push to GitHub, connect Cloudflare Pages, then start Phase 3 (compress PDF — pdfcpu or similar WASM, storage estimate warning banner).
