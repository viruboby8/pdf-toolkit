# Session context — PDF Toolkit

Running memory that survives between coding sessions. **Update at the end of every session** — the next session's agent reads this before touching code.

## Deployment
- **Hosting:** Railway (static serve via `npx serve dist --listen $PORT`)
- **GitHub repo:** https://github.com/viruboby8/pdf-toolkit
- **Production URL:** https://pdftoolkit.app (pending Railway connection — repo ready)
- **railway.json:** present at root — Railway auto-detects nixpacks build
- **public/serve.json:** carries COOP/COEP + security headers for Railway's `serve`

## Accounts & external services
- GitHub repo URL: https://github.com/viruboby8/pdf-toolkit
- AdSense account / status: — (apply after Railway deploy + Search Console indexing)
- AdMob app ID: —
- Analytics: — (add after launch)
- Play Console listing URL: — (Phase 6)
- Google Search Console: — (submit sitemap after first Railway deploy)
- Firebase project: —

## Key environment variables / secrets
None set yet. (When set, list KEY name only — never the value.)

## Decisions deviating from phase docs
- **Astro 5.18.1 used (not 5.5.x)** — latest Astro 5, works fine.
- **`@astrojs/svelte@7.x` pinned** — v8 requires Astro 6; `@vite-pwa/astro` only supports ≤Astro 5.
- **`@astrojs/mdx@4.3.14` pinned** — v5 requires Astro 6; v4 is Astro-5 compatible.
- **TypeScript 5.7 pinned** — v6 (default from scaffold) incompatible with `@astrojs/svelte@7`.
- **`@vite-pwa/astro` imported as default** — `import pwa from '@vite-pwa/astro'`, not `{ VitePWA }`.
- **Tailwind via `@tailwindcss/vite`** — modern Vite plugin approach (Tailwind 4). Works fine.
- **Svelte prop shorthand `{onfiles}` fails SSR** — when prop name (lowercase) differs from function name (camelCase), Astro SSR can't resolve the shorthand. Must write `onfiles={onFiles}` explicitly.
- **`@jsquash/jpeg` has no `init()` export** — self-initialises on first call; do not import `init`.
- **OCR on main thread** — Tesseract.js manages its own worker; nesting it inside the pdf.worker causes deadlocks. Runs on main thread only.
- **`@cantoo/pdf-lib` for password removal only** — standard `pdf-lib` handles all other ops to minimise bundle overlap.
- **Hosting changed from Cloudflare Pages to Railway** — `_headers` is Cloudflare-only; Railway uses `public/serve.json` for headers.
- **`astro-og-canvas` deferred** — skipped to avoid Astro-5 compat unknowns; `icon-512.png` used as default `og:image` + `twitter:image`. Per-page OG images can be added in Phase 6.
- **YAML `: ` (colon-space) in plain-scalar FAQ `a:` values** — js-yaml treats it as a new mapping key. Fix: quote the `a:` value string.
- **`protect` PDF tool not built** — Phase 4 shipped only `unlock` (remove password). The `protect` tool is deferred; TOOLS enum in `src/content/config.ts` omits it.

## Current file counts
- Pages: 68 (19 static .astro + 44 content-collection landing + 4 blog + 1 sitemap.html)
- Landing MDX entries: 44 in `src/content/landing/`
- Blog MDX entries: 3 in `src/content/blog/`
- Sitemap URLs: 68 in `dist/sitemap-0.xml`

## Open questions / unresolved
- Connect GitHub repo to Railway and verify first deploy.
- Submit `https://pdftoolkit.app/sitemap-index.xml` to Google Search Console after deploy.
- Run Lighthouse mobile check after Railway deploy (target ≥ 95 on all four scores).

## Useful links
- Research: `research.md`
- Phase index: `INDEX.md`
- Status snapshot: `status.md`
- Pending work: `pending.md`
- Completed log: `done.md`
- Next steps: `next-step.md`
