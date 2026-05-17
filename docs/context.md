# Session context — PDF Toolkit

Running memory that survives between coding sessions. **Update at the end of every session** — the next session's agent reads this before touching code.

## Deployment
- Cloudflare Pages project name: — (pending connection)
- Production URL: — (pending connection)
- Preview / branch URL pattern: — (pending connection)
- Custom domain: — (pending)
- DNS provider: —

## Accounts & external services
- GitHub repo URL: https://github.com/viruboby8/pdf-toolkit
- AdSense account / status: — (apply after Cloudflare deploy)
- AdMob app ID: —
- Analytics tool + URL/instance: —
- Play Console listing URL: —
- Google Search Console verified for: —
- Firebase project (if any): —

## Key environment variables / secrets
None set yet. (When set, list KEY name only — never the value.)

## Decisions deviating from phase docs
- **Astro 5.18.1 used (not 5.5.x)** — latest Astro 5, works fine.
- **`@astrojs/svelte@7.x` pinned** — v8 requires Astro 6; `@vite-pwa/astro` only supports ≤Astro 5.
- **TypeScript 5.7 pinned** — v6 (default from scaffold) incompatible with `@astrojs/svelte@7`.
- **`@vite-pwa/astro` imported as default** — `import pwa from '@vite-pwa/astro'`, not `{ VitePWA }`.
- **Tailwind via `@tailwindcss/vite`** — the scaffold used the modern Vite plugin approach (Tailwind 4) instead of `@astrojs/tailwind`. Works fine, kept as-is.
- **Svelte prop shorthand `{onfiles}` fails SSR** — when a Svelte prop name (lowercase `onfiles`) differs from the function variable name (camelCase `onFiles`), Astro SSR can't resolve the shorthand at pre-render time. Must use explicit `onfiles={onFiles}`. Affected all three new Phase 2 tool components; fixed.

## Open questions / unresolved
- Connect GitHub repo to Cloudflare Pages (build: `npm run build`, output: `dist/`).

## Useful links
- Research: `research.md`
- Phase index: `INDEX.md`
- Status snapshot: `status.md`
- Pending work: `pending.md`
- Completed log: `done.md`
