# Phase 6: Launch — TWA + Play Store + AdSense + HN/PH

**Project:** PDF Toolkit
**Estimated session time:** 6–8 hours (split across multiple sittings; some steps wait on external review queues — Play Store submission, AdSense approval — that take days–weeks of wall-clock time).
**Prerequisites:** Phases 1–5 complete. The web app is live on Cloudflare Pages with 12 working tools, 60+ programmatic landing pages, Lighthouse 95+, public MIT-licensed GitHub repo, and verifiable client-side processing.
**Ships:** A signed Android App Bundle (AAB) on the Play Store via Bubblewrap TWA, Digital Asset Links verified, full PWA polish (file_handlers, share_target, app shortcuts, offline mode), AdSense slots integrated with anti-CLS guards (approval submitted), Plausible (or similar privacy-respecting) analytics live, ProductHunt / Show HN / Reddit launch kits ready and triggered, and the public-facing review / metrics dashboard.

## Context (read me first)

You are working on **PDF Toolkit**, a 100% client-side privacy-first PDF utility (12 tools across merge / split / rotate / reorder / delete / extract / compress / jpg↔pdf / ocr / protect / unlock). Phases 1–5 shipped: the app is live on Cloudflare Pages from a public MIT-licensed GitHub repo, with a Web Worker + Comlink + OPFS architecture, a `@jsquash`-based compression pipeline that hits exact India size targets, Tesseract.js OCR, and 60+ SEO landing pages indexed via a Astro Content Collection.

This phase is the **launch**, in two senses. First, the *technical* launch: bundling the PWA as an Android TWA (Bubblewrap), getting Digital Asset Links verified, generating signing keys, and submitting the AAB to the Play Store. Plus the PWA polish that was deferred from Phase 1 — file_handlers (so the app appears under "Open PDF with...") and share_target (so it shows up in Android's share sheet). Second, the *marketing* launch: ProductHunt, Show HN, Reddit r/india/r/privacy/r/selfhosted, listicle outreach, AdSense application — the audience-acquisition push.

The Phase 6 work is intentionally split — some can be done in a single weekend session, some has wall-clock dependencies (Play Store review takes 1–7 days; AdSense approval takes ~30 days of organic content; ProductHunt has best launch days/times). Treat this doc as a launch *playbook*, not a single sitting.

Open-source-since-day-one (Phase 1) is leverage now: the GitHub repo is part of the launch story on HN and listicle outreach. Mirrors Stirling-PDF's playbook (research §8) — 25M+ downloads earned partly via being the most-starred PDF tool on GitHub.

## Goal of this phase

Package the app as a Play Store Android AAB, ship full PWA polish, integrate AdSense + privacy-respecting analytics, and execute a coordinated PH + HN + Reddit launch.

## Acceptance criteria
- [ ] PWA manifest updated with `file_handlers` (`.pdf`, `.jpg`, `.jpeg`, `.png`), `share_target` (POST endpoint that accepts a file and routes to the relevant tool), `shortcuts` (Merge, Compress, JPG to PDF, OCR).
- [ ] Workbox precaches the entire app shell + landing pages + WASM payloads; `runtimeCaching` covers Tesseract trained-data with a CacheFirst 30-day strategy.
- [ ] App works **fully** offline after first visit (verified by Chrome DevTools → Application → Service Workers → Offline checkbox + cold-load test).
- [ ] Bubblewrap TWA generated; AAB built and signed with a v2-signed upload key stored in the repo's `keystore/` (gitignored, with a `keystore/README.md` documenting recreation steps).
- [ ] Digital Asset Links `.well-known/assetlinks.json` deployed to the web origin; verified via Google's [Asset Links validator](https://developers.google.com/digital-asset-links/tools/generator).
- [ ] Play Store listing complete: title ("PDF Editor — Merge, Split, Compress, JPG to PDF"), short description (≤80 chars, keyword-rich), full description (4000 chars, structured: features → privacy → use cases → languages), 8 phone screenshots (real Android device, narrated with on-image captions), feature graphic 1024×500, privacy policy URL.
- [ ] Internal testing track populated; you (and 1–2 trusted testers) install via the test link and confirm core flows.
- [ ] Production track submission to Play Console queued. First-time accounts have an extra 14-day testing requirement — plan for that.
- [ ] Google AdSense application submitted (only do this after **30 days** of organic content + traffic — coordinate accordingly).
- [ ] AdSense placeholders in code with anti-CLS reserved space (`min-height` on slot containers), `<ins class="adsbygoogle">` markup ready, but the publisher ID env-var-gated so they're inert pre-approval.
- [ ] Plausible (or self-hosted Umami) analytics installed; pageview events fire on landing pages; custom events on `tool_used`, `compression_attempted`, `compression_target_hit`, with size-bucket labels (NEVER file contents).
- [ ] Cookie banner updated to reflect actual cookie usage (analytics if Plausible runs cookie-less = no banner change; AdSense cookies appear post-approval = update consent flow).
- [ ] ProductHunt draft submission ready: tagline, full pitch, gallery (4 screenshots + 1 demo gif), maker comment template — scheduled for a Tuesday/Wednesday morning UTC.
- [ ] Show HN draft ready: title ("Show HN: PDF toolkit running 100% in your browser (Astro + WASM + OPFS)"), submission text with architecture details, link to the GitHub repo and live URL.
- [ ] Reddit posts drafted for r/india, r/IndianStudents, r/privacy, r/selfhosted, r/productivity (each tailored to the sub's culture; do not copy-paste).
- [ ] Listicle outreach list assembled: 30 bloggers / sites maintaining "best free PDF tools" or "SmallPDF alternatives" posts, with email/Twitter handles + a templated pitch.
- [ ] Review-prompt UI: after 3 successful operations in one session, a non-modal toast asks "Enjoying PDF Toolkit? ⭐ on GitHub / Review on Play Store" (web vs TWA detection picks which CTA shows).
- [ ] Status page (`/status.json` or shieldsio badges in README) advertising "0 uptime issues in N days" — Cloudflare Pages free tier essentially gives this.
- [ ] Repo README polished for "first impression": clear hero, screenshot/GIF, install + dev quickstart, the architecture paragraph as a section, link to live demo, contribution guide, license badge.

## Tech stack & dependencies

**New installs / tooling (pin versions):**
- `@bubblewrap/cli@^1.24.0` — Google's CLI for generating TWA project + signed AAB. Global install: `npm i -g @bubblewrap/cli`.
- (Optional) `plausible-tracker@^0.3.9` — tiny client-side Plausible script if you self-host Plausible; or use the hosted `https://plausible.io/js/script.js`.
- Already installed: `@vite-pwa/astro` (Phase 1) — extend its manifest config in this phase.

**External services:**
- Google Play Console account ($25 one-time fee for new developer).
- AdSense account (free, but ~30 days of organic content prerequisite).
- ProductHunt account (free).
- Plausible (free if self-hosted, ~$9/mo cloud — for analytics-without-cookies; alternative: Umami self-hosted on Cloudflare Workers).

**Rationale (research §6 PWA + TWA, §7 monetization, §8 launch tactics):**
- Bubblewrap is the official Google-blessed TWA tooling; signing is automated; the AAB it produces is Play Store-compliant out of the box.
- Plausible / Umami are cookie-less / GDPR-friendly which preserves the privacy story (vs Google Analytics which would require a banner change and undermines the brand).
- AdSense is the chosen monetization (research §7 — Page RPM blended ~$2.75 across global+India = meaningful revenue at modest traffic).

## File/folder structure after this phase

```
pdf-toolkit/
├── ... (existing tree)
├── android/                                        # NEW — Bubblewrap-generated TWA project (gitignored output, but config tracked)
│   ├── twa-manifest.json
│   └── ... (build artefacts)
├── keystore/                                       # NEW (gitignored except README)
│   └── README.md
├── public/
│   ├── .well-known/
│   │   └── assetlinks.json                         # NEW — Digital Asset Links
│   ├── icons/                                      # add: 48, 72, 96, 144, 168 sizes for TWA
│   └── _headers                                    # may need ?? content-type for .well-known
├── src/
│   ├── components/
│   │   ├── AdSlot.svelte                           # NEW — anti-CLS reserved slot
│   │   ├── ReviewPrompt.svelte                     # NEW — appears after 3 successful ops
│   │   └── ShareTargetHandler.astro                # NEW — page that receives POSTed shared file
│   ├── pages/
│   │   ├── share-target.astro                      # NEW — manifest share_target POST destination
│   │   ├── status.json.astro                       # NEW — health/status endpoint
│   │   └── press-kit.astro                         # NEW — for HN/PH / press
│   └── lib/
│       └── analytics.ts                            # NEW — Plausible event helpers
├── launch/                                         # NEW (markdown sources, not built)
│   ├── producthunt.md
│   ├── show-hn.md
│   ├── reddit/
│   │   ├── india.md
│   │   ├── privacy.md
│   │   ├── selfhosted.md
│   │   └── ...
│   └── outreach/
│       └── listicles.csv
```

## Step-by-step tasks

1. **Update PWA manifest (`astro.config.mjs` → VitePWA → manifest):** add `file_handlers`, `share_target`, `shortcuts`, `categories: ['productivity', 'utilities']`, full icon set (48–512), `screenshots[]` for desktop+mobile (used by Play Store and "richer install UI" prompts). See snippet.
2. **Build `src/pages/share-target.astro`** as the POST endpoint that accepts the shared file (browser delivers it as `multipart/form-data`) and redirects to the right tool with the file pre-staged in OPFS via a worker handoff.
3. **Extend Workbox config** with `runtimeCaching` rules: trained-data CDN (`cdn.jsdelivr.net/npm/@tesseract.js-data/`) → CacheFirst with 30-day expiry; analytics endpoints → NetworkOnly (don't cache).
4. **Generate icons** for the full TWA set: `npx pwa-asset-generator ./public/logo.svg ./public/icons --type png --maskable false --opaque false` (with maskable variants for adaptive Android icons).
5. **Install Bubblewrap globally:** `npm i -g @bubblewrap/cli` and run `bubblewrap init --manifest=https://pdftoolkit.example/manifest.webmanifest`. Answer the prompts (package name `com.pdftoolkit.app`, host, etc.).
6. **Configure signing key:** `bubblewrap build` will prompt to create a keystore. Save it to `keystore/upload.keystore` (gitignored); store the passwords in a password manager AND in a `keystore/README.md` (NOT committed) documenting recreation. **Losing this key means losing the ability to update the app forever — back it up to two places.**
7. **Deploy `.well-known/assetlinks.json`** containing the SHA-256 fingerprint of your upload key. The file must be served from `https://<your-domain>/.well-known/assetlinks.json` with `Content-Type: application/json`. Add to `public/_headers` if needed. Verify with the Google Asset Links validator.
8. **Build the AAB:** `cd android && bubblewrap build`. Produces `app-release-bundle.aab` ready for Play Console upload.
9. **Create Play Console listing:** new app, fill in store listing (title / short desc / full desc / category / contact email / privacy policy URL / website URL), content rating questionnaire (PDF tool with no UGC = Everyone), target audience (13+).
10. **Capture screenshots on a real Android device.** 8 screenshots: (1) homepage hero, (2) merge tool with files dropped, (3) compress tool result card showing size savings, (4) India size preset chips, (5) JPG-to-PDF with phone-camera photos, (6) OCR result, (7) password protect, (8) "share to" from Gmail demonstrating file_handler integration. Add on-image text captions.
11. **Generate feature graphic 1024×500** (Figma or Canva). Hero text: "PDF tools that never leave your browser."
12. **Upload AAB to internal testing track.** Add your own Gmail + 1–2 testers. Install via the play.google.com testing link. Smoke test core tools.
13. **Submit to production track** after internal testing passes. New developer accounts face a 14-day testing-with-12-testers requirement — be ready for this delay; in the meantime keep iterating on the web app.
14. **Install Plausible** (hosted or self-hosted) — add the script tag to `Base.astro` behind a feature flag; create the site in Plausible dashboard; add goals for `tool_used`, `compression_attempted`, `compression_target_hit`.
15. **Build `src/lib/analytics.ts`:** wraps `plausible(eventName, { props })`. Tool components call `track('tool_used', { tool: 'compress' })` on success. NEVER pass filenames, sizes that could identify the file, or any user-input strings.
16. **Build `AdSlot.svelte`:** accepts a `slot` id; renders a `min-height` reserved div (anti-CLS) and an `<ins class="adsbygoogle">` element. Loads `adsbygoogle.js` once, gated behind `import.meta.env.PUBLIC_ADSENSE_CLIENT` being set. Placed: (a) below the tool fold on each tool page, (b) sidebar on landing pages, (c) bottom of blog posts. **No ads inside the active tool UI** — kills UX, harms approval.
17. **Build `ReviewPrompt.svelte`:** localStorage counter increments on every successful tool op; after 3 ops shows a one-time non-modal toast: "Like PDF Toolkit? ⭐ on GitHub" (web) or "Enjoying the app? Review on Play Store" (TWA detected via `referrer.includes('android-app://')`).
18. **Build `/press-kit.astro`:** a single page with brand colours, logo PNG+SVG downloads, screenshots, key stats, founder bio, contact email, "approved quotes" for press to use.
19. **Build `/status.json`** returning `{ status: 'ok', uptimeDays: N, lastIncident: null }`. Mostly cosmetic but it's an easy badge in the README.
20. **Apply for AdSense.** Site needs ~30 days of organic content + non-zero traffic + privacy policy + ToS + cookie banner — Phases 1 + 5 have these. Submit application; approval is typically 1–4 weeks.
21. **Write `launch/producthunt.md`:** tagline (≤60 chars), short pitch, gallery captions, maker comment template (~150 words explaining the why behind privacy-first PDF tools). Schedule for a Tuesday/Wednesday morning UTC.
22. **Write `launch/show-hn.md`:** post title, body (~150 words leading with architecture: "Astro + Svelte islands + pdf-lib + Comlink-orchestrated Workers + OPFS staging + @jsquash for compression + Tesseract.js for OCR + Workbox PWA + Bubblewrap TWA. Same codebase ships as Cloudflare Pages site and Play Store app. Verifiable zero network during processing. Open source MIT."), link to repo + live URL. Post Tuesday/Wednesday morning UTC.
23. **Write the Reddit drafts.** r/india: lead with "I built a free PDF compressor that hits 200 KB for SSC/Railway forms — entirely in your browser, no upload." r/privacy: architecture-led, no marketing fluff. r/selfhosted: highlight MIT + repo + self-host instructions (Cloudflare Pages free tier).
24. **Assemble listicle outreach list:** Google for "best free PDF tools 2026" + "alternatives to SmallPDF" + "free PDF compressor"; collect ~30 sites + author Twitter/email. Templated pitch (≤80 words): "Hi <name>, I built <PDF Toolkit> — entirely client-side (privacy + no daily limits). Open source. Live demo. I think it'd fit your <post>. No CTA expected, just hoping it's interesting."
25. **Launch sequencing:** Day 0 = Show HN. Day +1 = ProductHunt. Day +1 = Reddit (3 subs to start, watch reactions). Day +3 = Reddit (3 more). Day +5–14 = listicle outreach (rolling). Track which channels drive sustained traffic via Plausible.
26. **Post-launch: monitor & iterate.** Watch the first week's Plausible numbers, GitHub stars, Play Store reviews. Triage bugs reported on HN/Reddit within 24h. Pin a friendly comment on each post answering top questions.
27. **Add backlinks earned section to README** to capture social proof for future outreach.

## Key code patterns

**Manifest (in `astro.config.mjs`):**
```js
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'PDF Toolkit — Private, Unlimited',
    short_name: 'PDFToolkit',
    id: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    categories: ['productivity', 'utilities'],
    icons: [/* 48, 72, 96, 144, 168, 192, 256, 384, 512 + maskable variants */],
    screenshots: [
      { src: '/screens/desktop-home.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
      { src: '/screens/mobile-compress.png', sizes: '720x1280', type: 'image/png', form_factor: 'narrow' },
    ],
    file_handlers: [
      { action: '/merge-pdf', accept: { 'application/pdf': ['.pdf'] } },
      { action: '/jpg-to-pdf', accept: { 'image/jpeg': ['.jpg','.jpeg'], 'image/png': ['.png'] } },
    ],
    share_target: {
      action: '/share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: { files: [{ name: 'file', accept: ['application/pdf', 'image/*'] }] },
    },
    shortcuts: [
      { name: 'Merge PDF',     short_name: 'Merge',    url: '/merge-pdf' },
      { name: 'Compress PDF',  short_name: 'Compress', url: '/compress-pdf' },
      { name: 'JPG to PDF',    short_name: 'JPG→PDF',  url: '/jpg-to-pdf' },
      { name: 'OCR',           short_name: 'OCR',      url: '/ocr-pdf' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,wasm}'],
    runtimeCaching: [
      {
        urlPattern: /cdn\.jsdelivr\.net\/npm\/@tesseract\.js-data/,
        handler: 'CacheFirst',
        options: { cacheName: 'tess-langs', expiration: { maxAgeSeconds: 60*60*24*30, maxEntries: 30 } },
      },
    ],
  },
});
```

**`.well-known/assetlinks.json`:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.pdftoolkit.app",
      "sha256_cert_fingerprints": ["YOUR:UPLOAD:KEY:SHA256:FINGERPRINT:HERE"]
    }
  }
]
```

**`public/_headers` addition:**
```
/.well-known/assetlinks.json
  Content-Type: application/json
```

**`src/components/AdSlot.svelte`:**
```svelte
<script lang="ts">
  let { slot, format = 'auto', layout = '' } = $props<{slot: string; format?: string; layout?: string}>();
  const client = import.meta.env.PUBLIC_ADSENSE_CLIENT;
  let mounted = $state(false);
  $effect(() => {
    if (!client) return;
    if (!(window as any).adsbygoogle) {
      const s = document.createElement('script');
      s.async = true; s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(s);
    }
    setTimeout(() => { try { ((window as any).adsbygoogle ||= []).push({}); } catch {} mounted = true; }, 100);
  });
</script>
<div class="ad-slot" style="min-height: 280px; display: block; text-align: center;">
  {#if client}
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client={client}
         data-ad-slot={slot}
         data-ad-format={format}
         data-ad-layout={layout}
         data-full-width-responsive="true"></ins>
  {/if}
</div>
```

**`src/lib/analytics.ts`:**
```ts
const ENABLED = !!import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN;
export function track(event: string, props?: Record<string, string | number>) {
  if (!ENABLED) return;
  (window as any).plausible?.(event, { props });
}
```

**`src/components/ShareTargetHandler.astro`** (skeleton — actual file handling needs a POST endpoint, which on static-only Cloudflare Pages requires a Function (`functions/share-target.ts`); document this trade-off in the manifest):
```ts
// functions/share-target.ts (Cloudflare Pages Function)
export const onRequestPost: PagesFunction = async ({ request }) => {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.redirect('/');
  // Stash a sentinel in a redirect URL the client will pick up; the actual file goes via session storage on the client after redirect.
  return Response.redirect(`/jpg-to-pdf?shared=1`);
};
```

**`launch/show-hn.md` (template):**
```md
Title: Show HN: PDF Toolkit — runs 100% in your browser (Astro + WASM + OPFS)

Body:
I got tired of uploading sensitive PDFs (Aadhaar, bank statements) to SmallPDF/iLovePDF, so I built one that doesn't. Everything runs locally: pdf-lib for read/write, pdfjs-dist for rendering, @jsquash/mozjpeg-wasm for compression, Tesseract.js for OCR.

Architecture worth nerding about:
- Astro static-first site, Svelte 5 islands for tool UIs.
- All heavy work in dedicated Web Workers, ergonomic RPC via Comlink.
- Files stream into OPFS so the JS heap never holds a 100+ MB PDF.
- Compression: pdf-lib extracts images, mozjpeg re-encodes, binary search over JPEG quality to hit exact size targets (100/200/500 KB — useful for India govt portal upload caps).
- Workbox precaches the WASM for offline use; same codebase ships as an Android TWA on Play Store.

No upload, no daily limits, no watermarks, no signup. Open source MIT. DevTools Network confirms zero outbound calls during processing.

Live: https://pdftoolkit.example
Code: https://github.com/<you>/pdf-toolkit

Feedback welcome — especially on edge cases (huge PDFs, encrypted files, multi-language OCR).
```

## Gotchas (from research)
- **First-time Play Console accounts require 14 days of closed testing with 12 testers** before production rollout. Plan accordingly; don't promise a Play Store date in your HN/PH copy unless you're past that.
- **TWA `assetlinks.json` SHA256 must match the UPLOAD key, NOT the Play-managed signing key** if you use Play App Signing (you should — Google recommends it). After first upload, Play Console issues a separate app-signing certificate; add ITS fingerprint too. Both should be in `assetlinks.json` as an array.
- **Loss of the upload keystore = loss of ability to update the app.** Back it up to two physical places + a password manager. There is no recovery.
- **AdSense rejects sites with thin content, missing privacy policy, or recent (<30 day) domain history.** Phase 5's 60+ landing pages + Phases 1's privacy/ToS satisfy these. Don't apply earlier.
- **Play Store keyword stuffing in titles is penalized.** "PDF Editor — Merge, Split, Compress, JPG to PDF" is fine; "PDF Editor Merge Split Compress Convert JPG PDF Compressor Free Best Online" is not.
- **Cookie banner law (GDPR/India DPDP):** if AdSense personalised ads run for EU/UK users, consent is mandatory; cookie-less Plausible alone doesn't require a banner. After AdSense approval, update the banner to consent-gate the personalised-ads cookie.
- **`file_handlers` and `share_target` require HTTPS + a service worker + manifest entries**, AND Android 12+ for full UX. They degrade gracefully on older Android.
- **Bubblewrap's "fall-through to Chrome browser" gotcha:** if `assetlinks.json` isn't reachable when the TWA launches, the app shows a Chrome browser bar instead of full-screen. Verify with the Asset Links validator before submitting to Play Store.
- **PWA manifest `id` field changes hash if absent** — always set it explicitly (`id: '/'`) so the browser doesn't think it's a different PWA between deploys.
- **Don't ship full-screen ad interstitials in the TWA.** Per research §4, this is the #1 complaint about Play Store PDF apps and tanks ratings. Stick to bottom banners + non-intrusive in-content ads (the AdMob inline-native format is workable; rewarded ads are acceptable; interstitials between every action are NOT).
- **AdSense + Workbox interaction:** ad scripts can break offline-first behaviour if Workbox tries to cache them. Use NetworkOnly + ignore failures for ad domains.
- **CSP / CORS:** AdSense and Plausible both need `connect-src` and `script-src` exceptions if you tighten CSP. Audit `_headers` before launch.
- **Cloudflare Pages Functions count toward the "100k requests/day" free-tier cap.** `share_target` will fire on every share — fine, but if you go viral and burst above the cap, the Function will rate-limit. Cloudflare's pricing past free is cheap (~$5/mo for 10M reqs).
- **Plausible cloud is paid (~$9/mo).** Acceptable. Alternative: self-host Umami on Cloudflare Workers ($0).
- **PH submission peaks Tuesday–Thursday UTC mornings.** Avoid weekends and Mondays (low traffic).

## Verification (manual test checklist)
1. Visit live URL in mobile Chrome → "Install" prompt appears → install → app launches in standalone window.
2. From mobile file manager, long-press a PDF → "Share" → PDF Toolkit appears in share sheet → tapping it opens the relevant tool with the file pre-loaded.
3. From Android home screen, long-press the app icon → 4 shortcuts (Merge, Compress, JPG→PDF, OCR) visible → tapping each opens correct route.
4. Open the app offline (airplane mode) after first load → all 12 tools still work; OCR still works for any language pack already cached.
5. DevTools → Application → Service Workers shows the SW active; Storage shows cached assets + OPFS empty (after cleanup).
6. Install Bubblewrap-built APK on a phone → app opens full-screen (no Chrome address bar — proves `assetlinks.json` works) → core tools functional.
7. Google Asset Links validator (`https://developers.google.com/digital-asset-links/tools/generator`) shows both upload-key and Play-managed signing-key fingerprints verified.
8. Play Console internal testing build installs and launches cleanly on at least 1 fresh test device.
9. AdSense slots render placeholder min-height even with `PUBLIC_ADSENSE_CLIENT` unset (no CLS).
10. Plausible dashboard shows a live pageview event when you visit the homepage; a `tool_used` event fires after a successful merge.
11. Cookie banner appears on first visit; "Accept" persists; no banner re-shows on reload.
12. ReviewPrompt toast appears exactly once after 3 successful operations; dismissing it persists.
13. `/press-kit` page renders with brand assets downloadable.
14. `/status.json` returns valid JSON with uptime counter.
15. Show HN copy reads well aloud; ProductHunt gallery looks crisp on PH-sized previews; Reddit drafts feel sub-appropriate (not generic).
16. Lighthouse 95+ preserved across all routes despite added analytics + ad placeholders.
17. README first-impression: in 30 seconds a stranger understands what the app does, why it's different, and where to try it.

## Definition of "ship-ready"
- Play Store listing live (or "in review") — first-time-developer 14-day requirement clock running.
- AdSense application submitted with all prerequisites satisfied.
- Plausible analytics collecting real pageviews.
- ProductHunt + Show HN posts queued / posted to scheduled day.
- README polished, GitHub repo getting its first stars from launch traffic.
- The architecture paragraph from the README is something you would unironically paste into a senior-engineer cover letter tomorrow — the portfolio piece is done.

## References
- Research doc: `../research.md` §6 (PWA + TWA stack), §7 (AdSense RPM model + monetization), §8 (launch tactics).
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
- TWA codelab: https://developers.google.com/codelabs/pwa-in-play
- Digital Asset Links: https://developers.google.com/digital-asset-links/v1/getting-started
- Play Console: https://play.google.com/console
- AdSense policies: https://support.google.com/adsense/answer/48182
- File Handling API: https://developer.chrome.com/docs/capabilities/web-apis/file-handling
- Web Share Target: https://developer.chrome.com/docs/capabilities/web-apis/web-share-target
- Plausible Analytics: https://plausible.io/docs
- iLovePDF SEO teardown (linkable from launch posts): https://lettersbydavey.com/p/ilovepdf-seo-growth-story
