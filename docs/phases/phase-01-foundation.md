# Phase 1: Foundation

**Project:** PDF Toolkit
**Estimated session time:** 8–10 hours
**Prerequisites:** none
**Ships:** A live URL on Cloudflare Pages exposing three working tools — **Merge PDFs**, **Split PDF**, **Rotate PDF** — all 100% client-side via `pdf-lib`. A public, MIT-licensed GitHub repo. Basic PWA shell (installable, manifest, service worker). Privacy policy, ToS, cookie banner, Lighthouse 95+ on every route.

## Context (read me first)

You are building **PDF Toolkit**, a browser-based, fully client-side PDF utility (merge / split / rotate / reorder / compress / extract / JPG↔PDF / OCR). The wedge against entrenched competitors (SmallPDF, iLovePDF — together ~200M monthly visits) is verifiable architecture: files never leave the user's device. No upload, no daily limits, no watermarks, no paywall mid-task. Hosting is near-zero cost because all CPU work happens on the user's machine.

The target audience splits roughly 30–40% India (every government portal — UPSC, SSC, Railway, PAN, Aadhaar — caps PDF uploads at 100 KB / 200 KB / 500 KB / 1 MB), 25–35% US/UK/CA/AU (high RPM), and 25–35% rest-of-world. Mobile-first in India (~60/40 mobile/desktop blended), so responsive design and a future TWA Play Store app are mandatory.

The full stack across all phases is **Astro 5 + Svelte 5 islands + pdf-lib + pdfjs-dist + Comlink-orchestrated Web Workers + OPFS + mozjpeg-wasm + Tesseract.js + Workbox PWA + Cloudflare Pages**. Most of those land in later phases. This phase is intentionally minimal: scaffold the framework, ship three trivial-but-real tools (all pure `pdf-lib`, no Workers needed yet — merge/split/rotate handle 50 MB PDFs fine on the main thread), deploy, and put the repo on GitHub. Next phase (Phase 2) introduces the Web Worker + OPFS substrate that compression, OCR, and large-file work depend on.

Open-source from day one is non-negotiable. The repo is the credibility artifact for the eventual HN / ProductHunt launch (Stirling-PDF playbook: 25M+ downloads earned via being the most-starred PDF tool on GitHub). The MIT LICENSE goes in this phase.

## Goal of this phase

Stand up an Astro + Svelte project with three working PDF tools, deploy to Cloudflare Pages on a custom domain, and publish the repo on GitHub under MIT.

## Acceptance criteria
- [ ] `npm create astro@latest` scaffold runs, with the Svelte integration installed and a passing `npm run build`.
- [ ] Routes: `/`, `/merge-pdf`, `/split-pdf`, `/rotate-pdf`, `/privacy`, `/terms` all render statically.
- [ ] Drag-and-drop file zone accepts multiple PDFs on `/merge-pdf`, reorders via drag, outputs a downloaded merged PDF.
- [ ] `/split-pdf` accepts a single PDF, supports "every N pages" and "page range" modes, downloads a `.zip` (via `fflate`) or individual files.
- [ ] `/rotate-pdf` accepts a single PDF, lets the user pick 90 / 180 / 270 degrees for all pages, downloads the rotated PDF.
- [ ] All three tools work fully offline after first load (basic Workbox precache of HTML + JS + CSS — full PWA polish in Phase 6).
- [ ] Site shows a one-line cookie banner (consent stored in `localStorage`) and links to `/privacy` and `/terms`.
- [ ] Cloudflare Pages deployment configured (GitHub repo connected, `npm run build`, output `dist/`); production URL reachable.
- [ ] Repo public on GitHub with `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`, and `.github/workflows/ci.yml` running `npm run build` on PRs.
- [ ] Lighthouse (mobile, Slow 4G) ≥ 95 on Performance, Accessibility, Best Practices, SEO for `/`, `/merge-pdf`, `/split-pdf`, `/rotate-pdf`.
- [ ] DevTools Network tab shows **zero** outbound network calls during a merge/split/rotate operation (the wedge).
- [ ] `<meta>` tags + canonical + Open Graph + Twitter card on every page; `sitemap.xml` and `robots.txt` generated.
- [ ] No console errors on any route (desktop Chrome, mobile Chrome via DevTools emulator, Safari iOS via simulator if accessible).

## Tech stack & dependencies

**New installs (pin versions):**
- `astro@^5.5.0` — static-first framework, ships ~0 KB JS by default.
- `@astrojs/svelte@^7.0.0` — Svelte integration.
- `svelte@^5.16.0` — Svelte 5 with runes.
- `@astrojs/sitemap@^3.2.0` — auto sitemap.
- `@vite-pwa/astro@^0.5.0` — Workbox-powered PWA integration.
- `pdf-lib@^1.17.1` — read/write PDFs; merge/split/rotate are 1-liners.
- `fflate@^0.8.2` — tiny zip writer for split output.
- `svelte-dnd-action@^0.9.50` — drag-and-drop for file list reordering.
- `tailwindcss@^4.0.0` (via `@astrojs/tailwind`) — utility styling; small bundle.
- `@astrojs/tailwind@^6.0.0`.

**Dev-only:**
- `prettier@^3.4.0`, `prettier-plugin-svelte@^3.3.0`, `prettier-plugin-astro@^0.14.0`, `eslint@^9.x`, `typescript@^5.7`.

**Rationale (research §6):** Astro for SEO + minimal JS to static pages; Svelte islands for ~50–70% smaller interactive bundles than React. `pdf-lib` is the canonical client-side PDF write library — merge/split/rotate are trivial and need no Worker (these ops are O(metadata), not O(content)). `fflate` is ~8 KB and the smallest zip writer in the ecosystem. `@vite-pwa/astro` wraps Workbox cleanly inside Astro's build. Cloudflare Pages chosen for **unlimited bandwidth on the free tier** (research §6 — Vercel caps at 100 GB/mo which a popular utility blows past in days).

## File/folder structure after this phase

```
apps/03-pdf-toolkit/                 # project root (cwd for all commands in this phase)
├── docs/                            # already exists — planning + tracking
│   ├── research.md
│   ├── INDEX.md
│   ├── status.md
│   ├── context.md
│   ├── done.md
│   ├── pending.md
│   └── phases/
│       └── phase-01-foundation.md   # this file
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── .prettierrc
├── astro.config.mjs
├── CONTRIBUTING.md
├── LICENSE                          # MIT
├── package.json
├── public/
│   ├── favicon.svg
│   ├── icons/                       # 192/512 maskable PNGs for PWA
│   ├── robots.txt
│   └── _headers                     # Cloudflare Pages headers (COOP/COEP for SAB later)
├── README.md
├── src/
│   ├── components/
│   │   ├── CookieBanner.svelte
│   │   ├── Dropzone.svelte
│   │   ├── FileList.svelte
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   └── tools/
│   │       ├── MergeTool.svelte
│   │       ├── SplitTool.svelte
│   │       └── RotateTool.svelte
│   ├── layouts/
│   │   └── Base.astro
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── merge.ts             # pdf-lib merge
│   │   │   ├── split.ts             # pdf-lib split + fflate zip
│   │   │   └── rotate.ts            # pdf-lib rotate
│   │   ├── download.ts              # blob → file download
│   │   └── seo.ts                   # title/desc helpers
│   ├── pages/
│   │   ├── index.astro
│   │   ├── merge-pdf.astro
│   │   ├── split-pdf.astro
│   │   ├── rotate-pdf.astro
│   │   ├── privacy.astro
│   │   └── terms.astro
│   └── styles/
│       └── global.css
├── tailwind.config.mjs
└── tsconfig.json
```

## Step-by-step tasks

1. **Init the project (~10 min).** From inside `apps/03-pdf-toolkit/` (alongside the existing `docs/` folder, NOT in a new subdirectory), run `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git`, then `npm install`.
2. **Add integrations (~10 min).** `npx astro add svelte tailwind sitemap` (accept prompts). Then `npm install @vite-pwa/astro pdf-lib fflate svelte-dnd-action`.
3. **Create `astro.config.mjs`** with site URL, the four integrations, and a `vite` block that aliases `@` → `src/`. See snippet below.
4. **Drop `LICENSE` (MIT)** at repo root — use the SPDX MIT template verbatim, year 2026, holder = your name/handle.
5. **Author `README.md`** (~200 words): tagline ("PDF tools that never leave your browser"), features-shipped list, dev quickstart (`npm install && npm run dev`), tech stack badges, "Why this exists" paragraph (privacy as architecture, not policy), contribution pointer to `CONTRIBUTING.md`. This README is the first thing HN sees in Phase 6 — write it like it matters.
6. **Create `CONTRIBUTING.md`** (~80 words): node version, lint commands, branch naming, "no server-side code, ever" rule (the privacy contract).
7. **Init git, push to GitHub.** From `apps/03-pdf-toolkit/`: `git init && git add . && git commit -m "chore: scaffold"`. Create a public repo on GitHub (`gh repo create pdf-toolkit --public --source=. --push`).
8. **Add `.github/workflows/ci.yml`** running `npm ci && npm run build` on `push` and `pull_request` against `main`. Node 22.
9. **Build the `Base.astro` layout** with `<head>` containing canonical, OG, Twitter, viewport, theme-color, manifest link, JSON-LD `WebSite`. Slot for content. Include `<Header>` and `<Footer>` and `<CookieBanner client:idle />`.
10. **Build `Header.astro`** — logo wordmark + nav to four pages (Merge / Split / Rotate / soon: Compress) + GitHub star link.
11. **Build `Footer.astro`** — links to `/privacy`, `/terms`, GitHub repo, "100% client-side" badge.
12. **Build `CookieBanner.svelte`** — single line "We use cookies for ads (later). [Accept] [Reject]." Persists to `localStorage.consent`. Hide if already set.
13. **Build `Dropzone.svelte`** — accepts `accept` (mime list), `multiple` (bool); emits `files` event with `File[]`. Native `<input type=file>` + drag-and-drop handlers. Touch-friendly (44px+ tap target).
14. **Build `FileList.svelte`** — uses `svelte-dnd-action` to render reorderable file cards with thumbnail (defer thumbnails to Phase 2; for now show a PDF icon + filename + size + remove button).
15. **Build `src/lib/pdf/merge.ts`** — see snippet. Pure pdf-lib, takes `File[]`, returns `Uint8Array`.
16. **Build `src/lib/pdf/split.ts`** — two modes: `everyN(n)` returns array of `{name, bytes}`; `range(start, end)` returns single. Bundle multi-output via `fflate.zipSync`.
17. **Build `src/lib/pdf/rotate.ts`** — apply `page.setRotation(degrees(angle))` from `pdf-lib`'s `degrees` helper to every page (or selected pages); return `Uint8Array`.
18. **Build `MergeTool.svelte`** — Dropzone (multiple) → FileList (reorderable) → button "Merge & Download". Calls `merge.ts`, then `download.ts` → triggers blob download with sensible filename (`merged-YYYY-MM-DD.pdf`).
19. **Build `SplitTool.svelte`** — Dropzone (single) → mode selector (every N / page range / extract single) → outputs. Use `fflate` for zip when output count > 1.
20. **Build `RotateTool.svelte`** — Dropzone (single) → angle picker (90/180/270 buttons) → "Rotate & Download". Phase 2 adds per-page selection; this phase rotates all pages.
21. **Wire pages.** Each Astro page (`merge-pdf.astro`, etc.) renders `<Base>` with `<MergeTool client:visible />` (etc.). Add page-specific H1, 200-word intro paragraph, 4-item FAQ (helps SEO and Phase 5 reuse).
22. **Write `/privacy` and `/terms`.** Privacy policy must explicitly state "No file ever leaves your device" + "Future AdSense will set cookies (with consent)." Use a generator like `termsfeed.com` as a base, edit to be accurate.
23. **Configure PWA** in `astro.config.mjs` — `@vite-pwa/astro` with `registerType: 'autoUpdate'`, basic manifest (name, short_name, theme_color, icons 192/512), `workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] }`. No `file_handlers` / `share_target` yet — Phase 6.
24. **Generate PWA icons** with `pwa-asset-generator` (one-shot CLI: `npx pwa-asset-generator ./public/favicon.svg ./public/icons --manifest ./public/manifest.json`). Or hand-craft 192 + 512 maskable.
25. **Configure Cloudflare Pages.** In Cloudflare dashboard: Pages → Connect to GitHub → select repo → build command `npm run build`, output `dist/`. Add custom domain (free SSL). Add `_headers` to `public/` with `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` (preps SharedArrayBuffer for Phase 3 — research §6).
26. **Run Lighthouse** (Chrome DevTools, mobile, throttled) on every route. Fix anything below 95 (usually: missing alt text, low-contrast button, missing `<meta name=description>`).
27. **Manual smoke test.** Merge 3 small PDFs → opens. Split a 10-page PDF every 2 pages → 5-file zip. Rotate by 90 → preview rotation is correct in Preview.app / Acrobat.
28. **Commit, push, verify the deploy** at the production URL. Tag `v0.1.0` and write a one-line release note.

## Key code patterns

**`astro.config.mjs`:**
```js
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { VitePWA } from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://pdftoolkit.example',
  integrations: [
    svelte(),
    tailwind(),
    sitemap(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PDF Toolkit — Private, Unlimited',
        short_name: 'PDFToolkit',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'] },
    }),
  ],
  vite: { resolve: { alias: { '@': '/src' } } },
});
```

**`src/lib/pdf/merge.ts`:**
```ts
import { PDFDocument } from 'pdf-lib';

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const f of files) {
    const buf = await f.arrayBuffer();
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach(p => out.addPage(p));
  }
  return out.save({ useObjectStreams: true });
}
```

**`src/lib/pdf/split.ts`:**
```ts
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

export function zipParts(parts: SplitPart[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const p of parts) entries[p.name] = p.bytes;
  return zipSync(entries);
}
```

**`src/lib/pdf/rotate.ts`:**
```ts
import { PDFDocument, degrees } from 'pdf-lib';

export async function rotateAll(file: File, angle: 90 | 180 | 270): Promise<Uint8Array> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  src.getPages().forEach(p => {
    const cur = p.getRotation().angle;
    p.setRotation(degrees((cur + angle) % 360));
  });
  return src.save();
}
```

**`src/lib/download.ts`:**
```ts
export function downloadBlob(data: Uint8Array | Blob, filename: string, mime = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

**`MergeTool.svelte` (Svelte 5 runes, abbreviated):**
```svelte
<script lang="ts">
  import Dropzone from '../Dropzone.svelte';
  import FileList from '../FileList.svelte';
  import { mergePdfs } from '@/lib/pdf/merge';
  import { downloadBlob } from '@/lib/download';

  let files = $state<File[]>([]);
  let busy = $state(false);

  async function go() {
    busy = true;
    try {
      const out = await mergePdfs(files);
      downloadBlob(out, `merged-${new Date().toISOString().slice(0,10)}.pdf`);
    } finally { busy = false; }
  }
</script>

<Dropzone accept="application/pdf" multiple onfiles={fs => files = [...files, ...fs]} />
<FileList bind:files />
<button disabled={!files.length || busy} onclick={go}>
  {busy ? 'Merging…' : `Merge ${files.length} file${files.length === 1 ? '' : 's'}`}
</button>
```

**Astro tool page (`src/pages/merge-pdf.astro`):**
```astro
---
import Base from '@/layouts/Base.astro';
import MergeTool from '@/components/tools/MergeTool.svelte';
const title = 'Merge PDF — Free, Unlimited, 100% In Your Browser';
const description = 'Combine PDFs locally. No upload, no signup, no watermark, no daily limits. Works offline.';
---
<Base {title} {description}>
  <h1>Merge PDF files online</h1>
  <p>Drop two or more PDFs to combine them — entirely in your browser. Files never leave your device.</p>
  <MergeTool client:visible />
  <section><h2>FAQ</h2>{/* 4 questions schema'd in Phase 5 */}</section>
</Base>
```

**`public/_headers` (Cloudflare Pages):**
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: interest-cohort=()
```

## Gotchas (from research)
- **pdf-lib v1.17.x is the latest stable line** — there is no v2. Anything claiming "pdf-lib 2.x" is a fork (e.g., `@cantoo/pdf-lib`); don't accidentally install one here (we use the fork in Phase 4 for AES password support — research §2 v3 list).
- **`PDFDocument.load` throws on encrypted files** unless `{ ignoreEncryption: true }` is passed; we accept that flag here to let merge "just work" on most PDFs, but warn the user that the output will mirror input — full password handling is Phase 4.
- **COOP/COEP headers are set now** even though SharedArrayBuffer isn't used until Phase 3. Doing it now avoids a header-change-induced cache invalidation later, and lets browsers fingerprint the site as cross-origin-isolated from day one (research §6).
- **Cloudflare Pages free-tier file-size limit is 25 MB per asset.** Our biggest single chunk in Phase 1 is ~250 KB (pdf-lib gzipped), so safe — but plan for it in Phase 3 (ghostscript-wasm is ~10 MB).
- **Astro static export does NOT prerender Svelte islands.** That's intentional and correct — the islands hydrate on `client:visible`. Don't use `client:load` on tool components; you'll tank LCP. `client:visible` waits until the user scrolls them into view, which on a tool page means immediately, but the parser doesn't block (research §6 mentions Astro static landing pages routinely hit LCP < 500 ms; we need to preserve that).
- **Svelte 5 runes (`$state`, `$derived`) require `<script>` not `<script setup>`** — different syntax than Svelte 4 stores. Don't accidentally follow a Svelte 4 tutorial.
- **`@vite-pwa/astro` precaches everything matched by globPatterns at build time.** If you forget to add a glob (e.g., `woff2`), the icon font breaks offline. Keep the glob inclusive.
- **PDF→Word via LibreOffice WASM is NOT viable in 2026** ([DEV.to, 2026]). Do not let scope creep push this in. Same for high-fidelity PDF→Excel.
- **Don't use `client:only="svelte"` on tool components** — it disables SSG of the surrounding HTML, hurting SEO. Use `client:visible`.
- **Drag-and-drop on iOS Safari for files is finicky** — always provide a fallback native `<input type=file>` button inside the dropzone. Tested in research; touch users on iOS often can't drag files at all.

## Verification (manual test checklist)
1. `npm run dev` boots; visit `/`, see hero with "PDF tools that never leave your browser."
2. Visit `/merge-pdf`; drop two ~1 MB PDFs; click Merge; downloaded file opens in Preview.app and contains both files' pages in order.
3. Reorder via drag in `FileList`; merge again; order matches new order.
4. Drop a 10 MB PDF + a 30 MB PDF; merge; output ~40 MB; opens; UI didn't freeze for more than ~2 seconds (if it did, note it — Phase 2 moves this to a Worker).
5. `/split-pdf` on a 20-page PDF, every 5 pages → downloads a `parts.zip` containing 4 files; each opens with the right pages.
6. `/rotate-pdf` on a portrait PDF, choose 90 → output is landscape in Preview.app, all pages rotated.
7. Open DevTools → Network → clear → perform one merge → confirm **no** outbound requests besides any analytics you may have added (Phase 6 adds Plausible; in Phase 1 there should be zero).
8. DevTools → Application → Manifest shows the app, with both icons; "Add to Home Screen" works on mobile Chrome.
9. Run Lighthouse mobile on `/`, `/merge-pdf`, `/split-pdf`, `/rotate-pdf`; all four scores ≥ 95.
10. Console clean (no warnings/errors) on every route in Chrome and Safari (desktop).
11. Visit `/privacy` and `/terms`; both render with real content, not Lorem.
12. Cookie banner appears on first visit; clicking "Accept" hides it permanently (persists across reload).
13. `npm run build` produces `dist/` with `index.html` and per-route HTML; `dist/sw.js` (Workbox) present.
14. Push to GitHub; Cloudflare Pages build succeeds; production URL serves the site; HTTPS green.
15. View-source on `/merge-pdf` shows H1, meta description, canonical, OG, manifest link, JSON-LD WebSite snippet.

## Definition of "ship-ready"
- Production URL (custom domain) live, all four pages working, three tools functional on real PDFs from your own machine.
- Public GitHub repo with README + LICENSE + CI green.
- Lighthouse 95+ across the board on mobile.
- DevTools Network shows zero outbound calls during processing — the privacy claim is verifiable.
- A tweet-able URL you would actually send to a senior recruiter today.

## References
- Research doc: `../research.md` §2 (feature priority — weekend 1 scope), §6 (Astro+Svelte stack rationale, Cloudflare Pages free tier, pdf-lib canonical choice).
- pdf-lib: https://pdf-lib.js.org/
- Astro: https://docs.astro.build/
- Svelte 5 runes: https://svelte.dev/docs/svelte/$state
- @vite-pwa/astro: https://vite-pwa-org.netlify.app/frameworks/astro.html
- fflate: https://github.com/101arrowz/fflate
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- COOP/COEP for cross-origin isolation: https://web.dev/articles/coop-coep
