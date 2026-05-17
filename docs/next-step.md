# Next Steps — PDF Toolkit

**As of:** 2026-05-17
**Current state:** Phases 1–5 complete. 68 pages built. Code committed to main. Railway deploy pending.

---

## Immediate (do these first, in order)

### 1. Deploy to Railway
The repo is public at https://github.com/viruboby8/pdf-toolkit. `railway.json` is already present.

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. Select `viruboby8/pdf-toolkit`.
3. Railway auto-detects `railway.json` (nixpacks build → `npx serve dist --listen $PORT`).
4. Set custom domain: `pdftoolkit.app` (add CNAME in your DNS provider).
5. Verify the deploy: open the Railway URL and confirm tools work, no console errors.

### 2. Lighthouse check after deploy
Run Lighthouse mobile on these 4 URLs (Railway production, not localhost):
- `/compress-pdf-to-200kb-for-ssc`
- `/jpg-to-pdf-for-aadhaar`
- `/alternative-to-smallpdf`
- `/blog/how-to-compress-pdf-to-200kb-ssc-cgl-2026`

Target: ≥ 95 on Performance, Accessibility, Best Practices, SEO on all four. Common failures to watch:
- Missing `alt` text on images (unlikely — we have no `<img>` tags without alt)
- PWA score if service worker registration fails (check DevTools → Application)
- LCP if WASM bundles block first paint (unlikely — tools are `client:visible`)

### 3. Submit sitemap to Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console) → Add property → URL prefix → `https://pdftoolkit.app`.
2. Verify ownership via HTML tag method (add to `Base.astro` `<head>`) or DNS TXT record.
3. Sitemaps → Add → `https://pdftoolkit.app/sitemap-index.xml` → Submit.
4. Also submit to [Bing Webmaster Tools](https://www.bing.com/webmasters).

### 4. Submit sitemap to Bing Webmaster Tools
Same sitemap URL. Bing auto-shares data with DuckDuckGo, Yahoo, etc.

---

## Phase 6: Launch (TWA + AdSense + HN/PH)

See full plan: `phases/phase-06-launch-twa-adsense.md`

Key tasks in order:

### PWA polish (prerequisite for TWA)
- Add `file_handlers` to manifest (`.pdf`, `.jpg`, `.png`) so app shows in Android "Open with".
- Add `share_target` to manifest so it appears in Android share sheet.
- Add `shortcuts` array (Merge, Compress, JPG to PDF, OCR).
- Verify full offline mode: DevTools → Application → Service Workers → Offline checkbox.

### TWA (Trusted Web Activity) — Play Store
1. Install Bubblewrap CLI: `npm i -g @bubblewrap/cli@^1.24.0`
2. Init: `bubblewrap init --manifest https://pdftoolkit.app/manifest.webmanifest`
3. Build AAB: `bubblewrap build` → signs the AAB with your upload key.
4. Deploy `.well-known/assetlinks.json` to the site for Digital Asset Links.
5. Create Play Console listing (needs $25 one-time dev fee).
6. Upload AAB → Internal testing → Promote to production.
7. **Note:** First-time accounts require 20 internal testers for 14 days before production.

### AdSense
- Apply **only after** 30 days of organic traffic + content.
- Add ad slot placeholders now with `min-height` guards (anti-CLS) so there's no layout shift post-approval.
- Gate the publisher ID behind an env var so slots are inert pre-approval.

### Analytics
- Install Plausible (or Umami self-hosted) — cookie-free, preserves privacy story.
- Track events: `tool_used`, `compression_target_hit`, `download_complete`.
- **Do not** use Google Analytics — breaks the "no tracking" brand promise.

### Launch marketing (do these on the same day)
- **ProductHunt** — draft ready, post on Tuesday/Wednesday morning UTC. Tagline: "Free PDF toolkit running 100% in your browser — no uploads, no limits."
- **Show HN** — title: `Show HN: PDF toolkit running 100% in your browser (Astro + WASM + OPFS)`. Include architecture paragraph + GitHub link.
- **Reddit** — post to r/india, r/IndianStudents, r/privacy, r/selfhosted. Tailor each to the sub's tone.
- **Listicle outreach** — find 30 "best free PDF tools" or "SmallPDF alternatives" articles and email a short pitch with the live URL.

---

## Content cadence (ongoing, post-launch)

Publish 1 blog post per week targeting a high-intent long-tail keyword:
- Week 1: "How to compress PDF for UPSC 2026 application" → `/compress-pdf-for-upsc`
- Week 2: "Best free SmallPDF alternative for Indian students" → `/free-smallpdf-alternative`
- Week 3: "How to merge bank statements for HDFC home loan" → `/merge-pdf-for-bank-statement`
- Week 4: "PDF to JPG for WhatsApp — keep quality" → `/pdf-to-jpg-high-quality`

Each post: 600–800 words, one primary keyword, internal link to the target landing page, "Use the tool:" CTA at the bottom.

---

## Deferred (do not attempt yet)

- **PDF → Word conversion** — LibreOffice-WASM not stable; skip.
- **Per-page OG images** — `astro-og-canvas` deferred; `icon-512.png` is the default `og:image`. Add in Phase 6 polish if time allows.
- **Cloud sync / user accounts** — kills the privacy wedge.
- **AI summarization** — out of scope for the utility narrative.
- **`protect` PDF (add password)** — not built in Phase 4; add in a future minor phase if user demand warrants it.
