# PDF Toolkit — Implementation Phases Index

## Project recap

**PDF Toolkit** is a 100% client-side, privacy-first PDF utility (merge, split, rotate, reorder, compress, extract, JPG↔PDF, OCR). All processing runs in the user's browser via `pdf-lib` + `pdfjs-dist` + a custom canvas/`mozjpeg-wasm` compression pipeline + `tesseract.js`, with `OPFS` for large-file staging and `Web Workers` orchestrated through `Comlink` for the heavy lifting. The wedge against SmallPDF / iLovePDF is verifiable architecture: files literally never leave the device, there are no daily limits, no watermarks, and no paywall mid-task.

**Audience.** Global utility traffic with India over-indexed:
- Students worldwide (assignment merging, scan→PDF, LMS uploads).
- India government applicants (every state/central portal caps uploads at 100 KB / 200 KB / 500 KB / 1 MB — UPSC, SSC, Railway, PAN, Aadhaar).
- Office, legal, finance, freelancers — extremely privacy-sensitive, exactly where client-side wins.
- Mobile-first in India (~60/40 mobile/desktop blended) → PWA + TWA mandatory.

**Stack (locked).** Astro 5 (static-first SEO) + Svelte 5 islands (interactive tools) + `pdf-lib` 1.17.x + `pdfjs-dist` 4.x + Comlink 4.x + `mozjpeg-wasm` for compression + Tesseract.js 6 for OCR + Workbox PWA + Cloudflare Pages (unlimited bandwidth free tier) + Bubblewrap TWA for Play Store. Open-source on GitHub from day one (HN/PH credibility, mirrors Stirling-PDF playbook).

**Monetization.** AdSense (blended ~$2.75 Page RPM at 50/50 global/India split → $165/mo at 1K DAU, $825/mo at 5K DAU, $3.3K/mo at 20K DAU). Optional $5–$10 one-time "remove ads" unlock later. Hosting cost ≈ $0.

**Architecture talking-point (for senior interviews).**
> "Static-first Astro site. Svelte islands hydrate only on tool pages. Heavy ops run in dedicated Web Workers via Comlink. Large files stream into OPFS — never bloating the JS heap. Compression: pdf-lib extracts images, mozjpeg-wasm re-encodes them, a binary search over JPEG quality hits an exact target size, pdf-lib re-stitches. Workbox precaches everything for offline. Same codebase ships as an Android TWA. Verifiable zero network during processing."

---

## Phase list

| # | Phase | Session time | Ships | Status |
|---|-------|--------------|-------|--------|
| 1 | **Foundation** — Astro+Svelte scaffold, merge+split+rotate via pdf-lib, drag/drop UI, basic PWA, Cloudflare Pages deploy, MIT-licensed public GitHub repo, base SEO | 8–10 hrs | Live URL with three working tools, repo public | ✅ **Complete** (2026-05-17) |
| 2 | **Workers + OPFS architecture** — reorder, delete, extract pages; Web Worker + Comlink RPC; OPFS streaming for 100MB+ PDFs; pdfjs-dist thumbnails; progress bars | 8–10 hrs | Handles 300MB PDFs without freezing; the interview piece | ✅ **Complete** (2026-05-17) |
| 3 | **Compression pipeline** — canvas + mozjpeg-wasm worker chain; binary-search size targeting; India presets (100/200/500 KB, 1/2 MB); ghostscript-wasm fallback | 10–12 hrs | One-click "Compress to 200 KB for SSC" working | ✅ **Complete** (2026-05-17) |
| 4 | **JPG↔PDF + OCR + Passwords** — JPG→PDF & PDF→JPG; Tesseract.js worker (lazy-loaded languages, English+Hindi); password add/remove via @cantoo/pdf-lib | 8–10 hrs | Full feature parity with SmallPDF free tier | 🔜 **Next** |
| 5 | **Programmatic SEO scale-up** — Astro content collection driving 60+ landing pages (12 ops × size variants × India intents); JSON-LD (SoftwareApplication, FAQPage, HowTo); sitemap; internal link graph; blog scaffold | 6–8 hrs | 60+ unique pages indexed, Lighthouse 95+ across the board | — |
| 6 | **Launch: TWA + Play Store + AdSense + HN/PH** — Bubblewrap TWA build, Digital Asset Links, AAB signing; AdSense slot integration with anti-CLS guard; HN/PH/Reddit launch kit; analytics; review prompts | 6–8 hrs | App live on Play Store, AdSense applied, public launch executed | — |

**Total estimated effort:** ~46–58 hours (6 focused weekends).

---

## Dependency graph

```
Phase 1 (Foundation)
   |
   +--> Phase 2 (Workers + OPFS)  [requires P1 scaffold + pdf-lib basics]
   |       |
   |       +--> Phase 3 (Compression) [requires P2 worker harness + OPFS]
   |       |       |
   |       |       +--> Phase 6 (Launch) [needs all features for AdSense + Play Store]
   |       |
   |       +--> Phase 4 (JPG/OCR/Passwords) [needs P2 worker harness]
   |               |
   |               +--> Phase 6
   |
   +--> Phase 5 (SEO scale-up) [needs P1 deployed; can run parallel with P3/P4]
           |
           +--> Phase 6
```

Phases 3, 4, and 5 are independent of each other and can be reordered. Phase 6 is strictly last. Phase 2 must precede 3 and 4 because it builds the Worker/OPFS substrate that compression, OCR, and any other heavy op rides on.

---

## What gets explicitly deferred (do not attempt)
- **PDF → Word (.docx) high-fidelity.** LibreOffice-WASM is not stable in 2026. Honest scope is text-only DOCX; skip entirely for now.
- **Cloud sync / user accounts.** Kills the privacy wedge and adds infra cost.
- **AI summarization.** Distracts from the core utility narrative.
- **Server-side fallback for any tool.** Breaks the verifiable "no network" claim.

---

## Per-phase docs
- `phases/phase-01-foundation.md`
- `phases/phase-02-workers-opfs.md`
- `phases/phase-03-compression.md`
- `phases/phase-04-jpg-ocr-passwords.md`
- `phases/phase-05-seo-scale.md`
- `phases/phase-06-launch-twa-adsense.md`
