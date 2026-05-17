# PDF Toolkit — Phase 1 Research

**Date of research:** 2026-05-16
**Concept:** A browser-based, client-side PDF utility (merge, split, compress, reorder, rotate, delete pages, extract text, convert PDF<->image, fill forms). All processing happens locally in the user's browser via `pdf-lib`, `pdfjs-dist`, and WASM helpers. Privacy ("files never leave your device") is the primary wedge against entrenched competitors (SmallPDF, iLovePDF) that upload everything to a server.

---

## 1. Market Mix

PDF tooling is one of the largest evergreen utility markets on the open web. iLovePDF alone serves **~188 million visits per month** and ranks in the global top ~1,800 sites, with **India as its #1 country at ~22% of traffic** ([Letters by Davey, 2025](https://lettersbydavey.com/p/ilovepdf-seo-growth-story); [Similarweb, March 2026](https://www.similarweb.com/website/ilovepdf.com/)). Smallpdf reports having served **1.7B+ users globally** with **~20M monthly active users**, processing **100M+ PDFs weekly**; their top markets are the US, Germany, India, and Brazil ([smallpdf.com/pdf-statistics](https://smallpdf.com/pdf-statistics)).

That tells us two things bluntly:
1. The total addressable audience is enormous and globally distributed — this is not a niche, it is one of the largest utility categories on the web.
2. India is the single largest country in this niche by user count, which suits an India-based developer building India-aware features.

### Audience split (estimated for a new entrant)
| Region | % of traffic (likely) | Why |
| --- | --- | --- |
| India | 30–40% | Govt portals enforce small upload sizes; massive student population; matches iLovePDF profile |
| US / Canada / UK / AU | 25–35% | Highest-paying ad markets; office/legal/finance use |
| EU (DE, FR, ES, IT, NL) | 15–20% | GDPR-friendly privacy story resonates |
| LATAM / SEA / MENA | 15–25% | Emerging markets with similar govt-portal patterns |

### Use-case segments
- **Students** (largest single segment globally): merging assignments, scanning + combining textbook pages, converting JPG-of-handwritten-notes to PDF, compressing for college LMS upload caps.
- **Government applicants (India-heavy)**: every state govt form, UPSC/SSC/Railway/banking exam, Aadhaar/PAN/driving-licence portal has a size cap, typically **100 KB, 200 KB, 500 KB, or 1 MB**. UPSC DAF caps each certificate at ~500 KB; many SSC/Railway portals at 200 KB ([ExactPDF, 2026](https://exactpdf.com/blog/compress-pdf-for-government-portal); [DocSet.in](https://docset.in/blog/compress-pdf-under-200kb-free/); [tools.indgovtjobs.net](https://tools.indgovtjobs.net/pdf-compress/)).
- **Office workers / SMB**: merging signed PDFs, splitting invoices, sending lighter attachments by email.
- **Freelancers**: combining contracts and invoices, redacting client docs.
- **Legal / finance pros**: extracting pages, removing passwords from bank statements, filling forms — extremely privacy-sensitive (this is exactly where a client-side pitch wins).
- **Job-seekers**: combining resume + cover letter + certificates into one PDF under a portal-specified limit.

### Search-volume picture
Exact monthly figures aren't published openly, but the search ecosystem is documented clearly through SEO analyses:
- iLovePDF's top organic queries are dominated by **verb+object** phrases — "jpg to pdf", "pdf to word", "merge pdf", "compress pdf", "pdf to jpg" — and these drive ~80% of their desktop visits via organic search ([Letters by Davey](https://lettersbydavey.com/p/ilovepdf-seo-growth-story); [Semrush data](https://www.semrush.com/website/ilovepdf.com/overview/)).
- Long-tail India queries like "compress pdf to 100kb", "compress pdf to 200kb", "compress pdf to 500kb", "jpg to pdf less than 500kb" each have dedicated tools targeting them (e.g., [pdf.pi7.org/compress-pdf-to-100kb](https://pdf.pi7.org/compress-pdf-to-100kb), [zappy.tools/blog/compress-pdf-to-500kb](https://zappy.tools/blog/compress-pdf-to-500kb/)), implying meaningful, monetizable demand at each size bucket.
- "merge pdf" alone is widely cited as a 5–10M+ global monthly searches keyword across various tools; "compress pdf" similar; "pdf to jpg" and "jpg to pdf" each multi-million.

### Mobile vs desktop
The PDF-tools category historically skews **mobile-first in India** (cheap Android phones doing govt-portal uploads from the phone itself), and **desktop-first in office/legal use** in the West. Expect a roughly **60/40 mobile/desktop split** with India pulling the average toward mobile. This makes responsive design + an installable PWA + a TWA Play Store wrapper non-negotiable.

---

## 2. Feature List (prioritized)

### MVP — Weekend 1 (ship something usable)
1. **Merge PDFs** — drag-and-drop multiple files, reorder thumbnails, download combined PDF. Pure `pdf-lib`. Trivial.
2. **Split PDF** — by page range, by every N pages, or extract single pages.
3. **Rotate pages** — 90/180/270, individual pages or all.
4. **Delete pages** — page picker with visual thumbnails.
5. **Reorder pages** — drag-and-drop thumbnails.
6. **Download / save** — File System Access API where available, blob download elsewhere.

### v2 — Weekends 2–3 (the value layer)
7. **Compress PDF (image re-encoding)** — extract embedded images via pdf-lib, re-encode via canvas/WASM at quality presets. (This is the *hard one*; see Tech section.)
8. **India size presets** — "Compress to 100 KB / 200 KB / 500 KB / 1 MB" with a binary-search loop on JPEG quality.
9. **JPG → PDF** — drop images, pick page size (A4/Letter), margins, single or multi-page.
10. **PDF → JPG / PNG** — render via `pdfjs-dist` to canvas, export each page.
11. **Extract pages** — output a new PDF from a selected page range.
12. **PDF → Text** — `pdfjs-dist` getTextContent (works only for text-layer PDFs).
13. **Add page numbers / header / footer**.
14. **Add watermark** (text or image).

### v3 — Month 2+ (advanced + differentiated)
15. **OCR ("PDF to Text" for scanned PDFs)** — `tesseract.js` v6, runs in Web Worker, supports Hindi + Tamil + Telugu + 100 languages out-of-the-box ([tesseract.projectnaptha.com](https://tesseract.projectnaptha.com/); [Tesseract.js GitHub](https://github.com/naptha/tesseract.js/)).
16. **Searchable PDF** (OCR overlay on scanned PDFs).
17. **Password-remove / password-add** — needs `pdf-lib` fork with encryption support (e.g., `@cantoo/pdf-lib`); pure-JS is feasible for AES-128/256.
18. **Form fill / flatten** — `pdf-lib` supports `getForm()` for AcroForm.
19. **Sign PDF** — drawing-on-canvas signature + place-on-page.
20. **Redact** — black-box overlay + rasterize to truly remove content.
21. **Crop pages**.
22. **Edit text** (limited; pdf-lib can add text overlays, real edit is hard).
23. **Convert to grayscale / B&W** (helps shrink size further).
24. **Repair / linearize** PDFs.

### Advanced — months 3–6 (interview-worthy showpieces)
25. **PDF → Word (.docx)** — partially feasible client-side via libraries like `pdf2docx` ports, but layout fidelity is poor. LibreOffice-WASM is **not yet production-viable** ([DEV.to, 2026](https://dev.to/digitalofen/i-tried-running-file-conversion-fully-in-the-browser-wasm-libreoffice-ffmpeg-57mh)). Honest scope: ship a "text-only DOCX" version; mark high-fidelity as "coming soon" or skip.
26. **PDF → Excel** — same caveat; only useful for tabular PDFs with explicit table structure. Consider `tabula-js` style heuristics.
27. **PDF → HTML / EPUB**.
28. **Convert Office docs (DOCX/PPTX/XLSX) → PDF** — practical client-side via [`@nativedocuments/docx-wasm`](https://github.com/NativeDocuments/docx-wasm-client-side) (commercial license check needed) or fall back to server (lose privacy story).
29. **Bulk batch processing** — queue multiple ops, run in parallel workers.
30. **Compare two PDFs** (visual diff).
31. **Annotate / highlight / draw**.
32. **E-sign with self-issued cert** (X.509, fully client-side).

### Practical / impractical on client-side
| Feature | Client-side? | Notes |
| --- | --- | --- |
| Merge, split, rotate, delete, reorder | YES (easy) | `pdf-lib` |
| Render / extract text | YES | `pdfjs-dist` |
| JPG↔PDF | YES | `pdf-lib` + canvas |
| Compress (image re-encode) | YES (medium) | Custom pipeline via `pdf-lib` + canvas/WASM |
| Compress (Ghostscript-level) | YES via WASM | [ghostscript-pdf-compress.wasm](https://github.com/laurentmmeyer/ghostscript-pdf-compress.wasm) — ~10 MB WASM payload, big perf cost, but works |
| OCR | YES | `tesseract.js`, slower than server but acceptable |
| Password add/remove | YES (medium) | Forked pdf-lib with crypto |
| PDF → Word (high-fidelity) | NO | LibreOffice WASM not viable yet |
| PDF → Excel (tabular) | PARTIAL | Heuristic only |
| Form fill / flatten | YES | `pdf-lib` |
| Sign | YES | Canvas-based UI |

---

## 3. Competition

This is a **highly contested** but **highly winnable** space — incumbents have strong SEO moats but weak product moats (almost everyone uploads files to a server, has watermarks, daily limits, and aggressive paywalls).

### Web competitors (server-side, freemium)
| Site | Free tier | Pricing | Pain point | Source |
| --- | --- | --- | --- | --- |
| **ilovepdf.com** | 25 MB/file, daily task cap | $9/mo Premium | Files uploaded to server; paywall mid-task | [Capterra](https://www.capterra.com/compare/172606-173963/Smallpdf-vs-iLovePDF) |
| **smallpdf.com** | 100 MB but **only 2 tasks/day** | $15/mo Pro, $108/yr | The 2-task/day cap is brutal | [G2](https://www.g2.com/products/smallpdf/pricing), [ITQlick](https://www.itqlick.com/smallpdf/pricing) |
| **sejda.com** | 200 pages/50MB, 3 tasks/hour | $7.50/mo | Generous-ish but still capped | sejda.com |
| **pdf24.org** | Unlimited free, web + desktop | Free (ad-supported) | Big EU player; serious incumbent in compression; **also offers an offline desktop tool** ([HonestPDF, 2026](https://www.gethonestpdf.com/blog/is-pdf24-safe-2026)) |
| **sodapdf.com** | Limited free | $10/mo | Heavy upsell |
| **pdfcandy.com** | Watermark/limits on free | $6/mo | Desktop version is local, web uploads to ISO-27001 servers ([pdfcandy.com/security](https://pdfcandy.com/security.html)) |
| **combinepdf.com / freepdfconvert.com** | Basic free | — | Long-tail SEO shells |

### Client-side / privacy-first competitors
- **Stirling-PDF** ([github.com/Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF)) — open-source, ~50+ tools, **self-hosted via Docker** (not a hosted SaaS for end users). 25M+ downloads, #1 PDF tool on GitHub. **It's not direct competition for ad-supported web traffic**, since end users won't deploy Docker; but it's the gold standard for feature breadth.
- **PDFgear** — desktop + web, mixed model (local for basic, server for AI features) ([Tenorshare review](https://www.tenorshare.com/pdf-editor/pdf-editor/pdfgear-review.html)).
- **PDF24** — offers a true offline desktop version on top of the web tool.
- **PDFClear** ([Show HN, 2025](https://news.ycombinator.com/item?id=46036944)) — explicit client-side WASM + Transformers.js pitch; this validates the "fully in-browser" narrative as fresh-and-interesting to HN.
- **simplepdf.eu** — privacy-positioned, mostly form-filling.
- **kordu.tools** ([Free Alternatives to SmallPDF and iLovePDF](https://kordu.tools/blog/free-alternatives-smallpdf-ilovepdf/)) — explicit "no limits" positioning.

### Indian players
- **sarkariresult.tools, indgovtjobs.net, sarkaricareeralert.com, docset.in** — small SEO shops targeting "compress pdf to 100kb" etc. Most are still **server-side** uploads, often slow, ad-heavy, mediocre UX. **This is exactly the gap.**
- **Pi7 PDF Tool (pdf.pi7.org)** — ranks well for compression-to-size keywords.
- **WebSauda, Zappy Tools, SortMyPDF** — similar.

### Play Store landscape
- **Adobe Acrobat Reader** — 1B+ installs, defacto reader.
- **Foxit PDF Editor** — 10M+ installs, 4.8 stars ([UPDF, 2026](https://updf.com/mobile-app/free-pdf-editor-android/)).
- **WPS Office, PDFelement, Xodo** — large incumbents.
- **"PDF Editor & Reader" / "Merge PDF" type apps** — long tail of low-quality, ad-spammed apps with 1–10M installs each. The bar to beat for review quality is **modest**.

### Where the gaps are
1. **Pure client-side** with no upload — most "privacy-first" claims still upload over TLS and trust deletion policies. True in-browser is verifiable (DevTools shows no network calls).
2. **No daily limits** — Smallpdf's 2-tasks/day is hostile; we can offer truly unlimited because we have zero processing cost.
3. **India size presets** — "Compress to exactly under 200 KB" as a one-click preset, not a slider you have to fiddle with.
4. **No watermarks ever**.
5. **No paywall mid-task** — discoverable cost is zero.
6. **Mobile-first design** — most PDF tools have desktop-y UIs that are clunky on Indian Android.

---

## 4. Pain Points (from reviews, Reddit, Trustpilot)

Themes that repeat across [Capterra Smallpdf reviews](https://www.capterra.com/p/172606/Smallpdf/reviews/), Trustpilot, Reddit r/india, r/productivity, and the PDF24 Trustpilot page:

1. **Daily/hourly task limits** — "Smallpdf gives you 2 free tasks per day. Done after two files regardless" ([G2](https://www.g2.com/products/smallpdf/pricing)). Users hit the wall mid-workflow.
2. **Watermarks** — some competitors (not Smallpdf, but several Indian "free" tools) inject watermarks silently.
3. **Mid-task paywall** — upload your file, wait for processing, then "Upgrade to download" — extremely common complaint.
4. **Privacy fear for sensitive docs** — uploading Aadhaar/PAN/bank statements/legal contracts to random servers is a real concern. Multiple Reddit threads in r/india ask "is it safe to upload my Aadhaar to ilovepdf?" — the honest answer is "they delete after X hours, but you're trusting them"; a client-side tool can answer "the file literally never leaves your phone."
5. **Slow uploads on Indian connections** — a 20 MB scanned PDF over a 1 Mbps mobile uplink is 2–3 minutes just to upload before anything happens. Client-side is **instant** once the WASM is cached.
6. **Compression quality** — many tools either compress too aggressively (destroying readability) or not enough to hit the 200 KB cap. Iterative quality search with a target size is rare.
7. **Ad spam on mobile apps** — Play Store PDF apps frequently have full-screen interstitials between every page tap, low ratings as a result. There's room to win on "fewer, less-intrusive ads."
8. **Login walls** — Smallpdf and others increasingly require sign-in even for basic tasks.
9. **Lost work** — uploaded a file, server hiccuped, lost the file and had to start over. Client-side avoids this entirely.
10. **Bad mobile experience** — drag-and-drop UIs that don't work on touch, tiny page thumbnails, no native share-target integration.

---

## 5. Opportunity / Positioning

**Tagline candidates:**
- "PDF tools that never leave your browser."
- "Free, unlimited PDF tools. Zero uploads."
- "Your PDFs stay on your device. Period."

### Positioning pillars
1. **Privacy as architecture, not policy.** Most competitors say "we delete after 2 hours." We say "the file is never sent." This is verifiable in DevTools and resonates strongly with anyone handling Aadhaar, PAN, bank statements, or legal docs.
2. **Truly unlimited free.** No daily caps, no file-count caps, no login wall. Possible because our compute cost is zero (it's the user's CPU). State this loudly on every page.
3. **Speed.** No upload round-trip. On a 50 MB PDF over a 2 Mbps Indian mobile connection, that's a 3-minute upload competitors must do but we don't. After first visit, the WASM is cached and tools open instantly offline.
4. **India-specific size presets.** "Compress to 100 KB / 200 KB / 500 KB / 1 MB" as one-click buttons on the compress page. Each preset = its own SEO landing page.
5. **No watermarks. No paywalls. Ever.** Monetize purely through unobtrusive AdSense + an optional one-time "remove ads" unlock.
6. **PWA + Play Store.** Install on phone, works offline, share-target ("Share PDF to [App]" from Gmail/WhatsApp/file manager).

### Defensibility
- **SEO long-tail moat:** programmatic landing pages — one per tool × per use case × per common size cap × per audience. Plausibly 200+ unique-intent pages (see Marketing section).
- **Performance moat:** if our Lighthouse stays at 95+ and we ship <500 KB initial JS (Astro/SvelteKit), we'll outrank slow competitors on Core Web Vitals over time.
- **Brand: open-source on GitHub.** Mirrors Stirling-PDF's playbook for credibility. Tech-blogger linkbait.
- **AI search era (2026):** ChatGPT/Perplexity/Google AI Overviews increasingly cite tools by name; being "the privacy-first one" is a memorable wedge for LLMs to recommend.

---

## 6. Best Tech to Build

### Framework recommendation: **Astro** (with Svelte islands for interactive tool pages)
Reasoning:
- **SEO is the entire growth strategy** here. Astro ships ~0 KB JS to static landing pages by default, which gives the best possible LCP/INP/CLS — and 2026 SEO is more sensitive to Core Web Vitals than ever ([eastondev, 2025](https://eastondev.com/blog/en/posts/dev/20251202-astro-vs-nextjs-comparison/); [nunuqs, 2026](https://www.nunuqs.com/blog/nuxt-vs-next-js-vs-astro-vs-sveltekit-2026-frontend-framework-showdown)). Astro static sites commonly hit LCP under 500 ms.
- The 200+ programmatic landing pages ("compress pdf to 200kb", "merge pdf online india", etc.) are static content — Astro's content collections + static generation is perfect.
- Interactive tools (merge/split/compress UIs) become **Svelte islands** — Svelte 5 ships ~50–70% less JS than React for equivalent UIs.
- Next.js is the safe alternative if you want React familiarity, but the bundle-size tax hurts mobile India users.

| Framework | Recommendation | Why / why not |
| --- | --- | --- |
| **Astro + Svelte islands** | **Primary pick** | Best SEO, smallest mobile JS, perfect fit for static-heavy + interactive-pockets architecture |
| Next.js (App Router, static export) | Acceptable | More familiar, larger ecosystem; bundle size higher; great if you want React component reuse |
| SvelteKit (full) | Strong alt | Smaller bundles than Next; less SEO-optimized out of the box than Astro |

### PDF library stack (2026 best-of-breed)
- **`pdf-lib`** — read/modify/write PDFs. Merge, split, rotate, reorder, delete, page extraction, form filling. The canonical choice ([npm-compare](https://npm-compare.com/pdf-lib,pdf-parse,pdfjs-dist)).
- **`pdfjs-dist`** — Mozilla's PDF.js for rendering thumbnails, extracting text content, rasterizing pages to canvas for image export.
- **`@cantoo/pdf-lib`** (or similar maintained fork) — for AES password add/remove that vanilla pdf-lib doesn't support.
- **`jspdf`** — only if generating PDFs from scratch (e.g., JPG→PDF can be done with jspdf or pdf-lib; pdf-lib is usually cleaner).
- **`tesseract.js` v6** — OCR. Runs in Web Worker. ~95–99% accuracy on clean printed text ([Tesseract.js](https://tesseract.projectnaptha.com/); [DEV.to](https://dev.to/helloashish99/ocr-in-the-browser-how-tesseractjs-makes-pdf-text-extraction-free-5ab2)).
- **Compression layer:**
  - **Approach A (lighter):** custom pipeline — extract embedded images via `pdf-lib`, re-encode with `<canvas>.toBlob('image/jpeg', quality)` or `mozjpeg-wasm`, write back. Cheap, fast, ~70% of practical cases.
  - **Approach B (heavier, full Ghostscript fidelity):** [`ghostscript-pdf-compress.wasm`](https://github.com/laurentmmeyer/ghostscript-pdf-compress.wasm) — ~10 MB WASM, runs in Web Worker, "virtually no limit on PDF size". Use as fallback for hard cases. Or [pdfcomprezzor](https://github.com/henrixapp/pdfcomprezzor) using pdfcpu.
  - **Approach C (size-target presets):** wrap A/B in a binary search over JPEG quality, stopping when output ≤ target (100/200/500 KB).

### Heavy-lifting / perf architecture (this is the interview-talking-point section)
- **Web Workers** for every CPU-heavy op (compress, OCR, render-to-image). UI stays at 60fps.
- **`Comlink`** for ergonomic worker RPC.
- **OPFS (Origin Private File System)** for staging large files. OPFS supports 300 MB+ files, is sync-accessible from Workers, and is 3–4× faster than IndexedDB ([MDN OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system); [renderlog](https://renderlog.in/blog/origin-private-file-system-opfs/)).
- **Streaming reads** via `Blob.stream()` and `ReadableStream` for files >50 MB to avoid loading entire bytes into JS heap.
- **File System Access API** for "save back to same location" on desktop Chromium browsers (with graceful fallback to blob download).
- **`navigator.storage.estimate()`** to warn the user if their quota is tight before a large op.

### PWA + offline
- **`@vite-pwa/astro` or `workbox`** — precache the WASM payloads, app shell, and tool UIs. After first load, the app works offline.
- **Manifest** with `file_handlers` and `share_target` so the app appears as a target for "Open PDF with…" and "Share to…" on Android.
- **TWA via Bubblewrap** — once Lighthouse PWA score ≥ 80 and Digital Asset Links are set up, package as Android AAB and ship to Play Store ([Google Developers codelab](https://developers.google.com/codelabs/pwa-in-play); [GitHub: bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)).

### Hosting
- **Cloudflare Pages** — primary. **Unlimited bandwidth on the free tier** (with fair-use), 500 builds/month free, free SSL, custom domains ([Cloudflare Pages docs](https://developers.cloudflare.com/pages/platform/limits/); [VPS Ranking](https://vpsranking.com/serverless/cloudflare-pages/)). Single-file asset size limit is 25 MB on free, which is fine for WASM chunks (gzipped ghostscript ~7–10 MB; chunk-split if needed).
- **Vercel** — fallback. Bandwidth-capped on free (100 GB/month), which becomes a problem at 5K+ daily users with 1 MB initial loads.
- **GitHub Pages** — usable but no edge cache control; skip.

### Memory & perf — handling 50+ MB PDFs in-browser
- Never load the whole PDF into a JS string. Use `ArrayBuffer` + transfer to Worker (zero-copy via `postMessage` transferables).
- For compress, process pages one at a time, write incrementally to OPFS, then assemble. Avoid materializing the full output in memory.
- Run with `--enable-features=SharedArrayBuffer` available (requires COOP/COEP headers on the host — Cloudflare Pages can set these via `_headers`). SharedArrayBuffer enables full multi-threaded WASM (tesseract.js and ghostscript-wasm both benefit).
- Show a real progress bar driven by worker postMessage progress updates — perceived speed matters more than actual speed.

### The architecture story for interviews
> "A static-first Astro site, with Svelte islands hydrated only on tool pages. Heavy work runs in dedicated Web Workers using Comlink. Large files stream into OPFS for staging — never bloating the JS heap. PDF compression uses a custom pipeline: pdf-lib extracts images, a canvas+mozjpeg-wasm worker re-encodes them at iteratively-decreasing quality until the binary-searched target size is met, and pdf-lib stitches the output. The whole thing precaches via Workbox for offline use, and the same codebase ships as an Android TWA. Verifiable zero network calls during processing — privacy as architecture, not policy."

That paragraph is gold in a senior interview.

---

## 7. Revenue Potential

PDF tools are **the** archetype of a "high-volume, mid-CPM, ad-supported utility" and the ceiling here is genuinely higher than image compression or QR generators, because the global Western audience is larger and the use cases are office/legal/finance.

### CPM / RPM benchmarks (2025–2026)
- **AdSense Page RPM (India):** $0.50–$3 typical for general utility content ($10+ for finance niches). Translates to roughly **₹40–₹250 per 1,000 pageviews** ([dicloak, 2025](https://dicloak.com/blog-detail/google-adsense-rpm-by-country-2025-how-to-maximize-revenue-across-countries); [makemoney.net.in](https://www.makemoney.net.in/blog/how-much-does-adsense-pay-in-india-per-1000-views)).
- **AdSense Page RPM (US/UK/CA/AU):** $5–$15 typical for utility, can spike to $20+ for "compress pdf" because of competing PDF software bidders (Adobe, Foxit, Smallpdf compete on these keywords).
- **AdMob Interstitial (India):** $0.50–$2 eCPM utility apps; $1–$4 with optimization ([thesrzone](https://www.thesrzone.com/2024/01/admob-ecpm-rates-by-country.html); [maf.ad](https://maf.ad/en/blog/mobile-ads-ecpm/)).
- **AdMob Interstitial (US/EU):** $5–$15 typical.
- **Banner ads:** ~$0.10 India, $0.50–$1 Western — banners are negligible income; interstitials and rewarded video are the real money for the mobile app.
- **AdSense approval:** site needs ~30 days of organic content + Core Web Vitals + privacy policy + ToS + cookie banner. Plan to apply at ~month 2, get approved by month 3.

### Modeled revenue (web only)
Assume 2 pageviews per session (landing → tool result), 50/50 global/India split, $4 global Page RPM and $1.50 India Page RPM (blended ~$2.75).

| Users / day | Pageviews / mo | Revenue / mo |
| --- | --- | --- |
| 1,000 | 60,000 | ~$165 (~₹14,000) |
| 5,000 | 300,000 | ~$825 (~₹70,000) |
| 20,000 | 1.2M | ~$3,300 (~₹275,000) |
| 50,000 | 3.0M | ~$8,250 (~₹685,000) |

Now add the Play Store TWA (assume 20% of web users also install the app, with 1 interstitial per session at a blended $2 eCPM):
- 5,000 web/day → 1,000 app users → 1,000 interstitials/day → ~$60/mo extra
- 50,000 web/day → 10,000 app users → ~$600/mo extra

### Timeline projection (realistic for a part-time weekend builder)
- **Month 1–2:** Build MVP + 30 SEO pages. 0–50 users/day from word-of-mouth and ProductHunt.
- **Month 3–4:** AdSense approved. Programmatic SEO pages start ranking (long-tail "compress pdf to 200kb" type queries). 100–500 users/day.
- **Month 6:** Strong long-tail rankings, growing backlinks. **1,000–3,000 users/day**, ~$200–$600/mo revenue.
- **Month 12:** **5,000–10,000 users/day** plausible if you keep shipping content and the privacy angle picks up on HN/Reddit/PH. **$800–$2,500/mo**.
- **Month 18–24:** Top-tier outcome (not guaranteed) is **30,000–100,000 users/day**, **$5,000–$15,000/mo**. iLovePDF-scale (188M/mo) is years of compounding away.

### Premium unlock (optional, plausible)
A one-time $5–$10 (₹399 for India) "Pro" unlock to remove ads, raise local file limits, enable bulk batch, or unlock OCR for long documents. Western users buy these at 0.5–1% conversion; India closer to 0.1%. At 50K users/day with 30% global non-India:
- ~15,000 global users/day × 0.5% × $7 lifetime ÷ 365 ≈ **$1,400/mo recurring on top of ads**.
That's not life-changing but it's a meaningful 30–40% revenue lift, and it's pure-margin since Polar/LemonSqueezy/Razorpay handle billing.

---

## 8. Marketing / First 1000 Users

### SEO is the entire game (~70% of effort)
ILovePDF's SEO playbook is the template: **verb + object pages, link them densely, keep them fast** ([Letters by Davey](https://lettersbydavey.com/p/ilovepdf-seo-growth-story)).

**Programmatic landing-page matrix** (target ~200 pages):
- **Operations (12):** merge, split, compress, rotate, delete pages, reorder, jpg-to-pdf, pdf-to-jpg, pdf-to-text, ocr, watermark, page-numbers, password-remove.
- **Size-target variants for compress (10):** 100kb, 200kb, 300kb, 500kb, 1mb, 2mb, 5mb, 10mb, 20mb, 50kb. Each its own page: `/compress-pdf-to-200kb`.
- **India intent pages (10):** "for upsc application", "for ssc form", "for railway exam", "for pan card upload", "for aadhaar update", "for college admission", "for visa application", "for kyc", "for income tax return", "for bank statement".
- **Quality / use modifiers (8):** "high quality", "without losing quality", "online free no signup", "no upload", "in browser", "offline", "without watermark", "unlimited".
- **Comparison pages (5):** "alternative to smallpdf", "alternative to ilovepdf", "free smallpdf alternative", "smallpdf vs [app]", "ilovepdf vs [app]".

Each page = unique tool widget + 300–500 words of genuinely useful content (not spun) + FAQ schema + screenshots. Generate from a single Astro template, content collection JSON, build at deploy.

**Technical SEO must-haves:**
- Lighthouse 95+ across the board.
- Structured data: `SoftwareApplication`, `FAQPage`, `HowTo`.
- Sitemap, robots.txt, canonical tags.
- Internal linking between every related tool ("After merging, you may want to compress" → contextual links).
- One blog post per week reinforcing a target page, e.g., "How to compress a PDF to under 200 KB for SSC CGL application 2026" linking to `/compress-pdf-to-200kb`.

### Launch tactics (first 1000 users)
1. **ProductHunt launch** — the "no upload, no limits, no signup" angle hits PH sweet spots. Aim for top 5 of the day; that's typically 500–2,000 one-time visitors and 50–200 sticky.
2. **Show HN** — "Show HN: A PDF toolkit that runs 100% in your browser (Astro + WASM + OPFS)." HN loves the architecture; submit on a Tuesday/Wednesday morning UTC. Even a modest 50-upvote post yields 1–3K visitors.
3. **Reddit:**
   - r/privacy (mention the architecture, not the URL — let people DM/search)
   - r/selfhosted (open-source angle)
   - r/india + state-specific subs (govt portal angle)
   - r/IndiaJobs, r/IndianStudents (compress-to-200KB use case)
   - r/productivity, r/Frugal
4. **Open-source on GitHub** — public repo with a good README, deploy preview, contribution guide. This is link-bait for tech bloggers and gets you into "best free PDF tools" listicles. Mirrors Stirling-PDF's playbook.
5. **Listicle outreach** — email/tweet ~30 bloggers who maintain "best free PDF tools" / "alternatives to SmallPDF" posts. A single inclusion in a top listicle is 100–500 visits/month for years.
6. **Chrome extension** (low effort, copy iLovePDF's playbook) — adds an "Open PDF in [App]" right-click. Each install seeds repeat usage and brand recall.
7. **WordPress plugin** (defer to month 6+) — same logic.
8. **Twitter/X + Indie Hackers** — build-in-public journal; weekly user/revenue numbers.
9. **YouTube shorts** — 30-sec demos of "compress PDF to 200 KB for SSC form in 5 seconds." Indian regional-language voice-overs work disproportionately well here.
10. **Play Store ASO:**
    - Keyword title: "PDF Editor — Merge, Split, Compress, JPG to PDF"
    - First-screenshot: "Files never leave your phone"
    - 80+ reviews in first month from genuine users (no fake reviews; ask for them in a non-modal "enjoy the app?" prompt after 3 successful operations).

### Realistic 1000-DAU timeline
- **Month 1:** Build + 30 pages live. ~10–30 DAU from launch buzz.
- **Month 2:** AdSense applied. 60+ pages. ~50–150 DAU.
- **Month 3–4:** First SEO rankings (long-tail). ~200–500 DAU.
- **Month 6:** Strong long-tail rankings + a few backlinks from listicles. **~1,000 DAU**. Hit the milestone.
- **Month 9–12:** Compounding. ~3,000–8,000 DAU.

Hitting 1K DAU in 6 months is realistic with consistent weekend effort; 3 months is aggressive but possible if a PH/HN launch lands well.

---

## Verdict & Recommended First-Weekend Scope

**Verdict: STRONG BUILD. Highest-ceiling app in the Phase 1 portfolio.**

Why:
- **Massive proven demand** (iLovePDF: 188M visits/mo, Smallpdf: 1.7B users served).
- **Real, defensible wedge** (client-side / privacy / no daily limits / India size presets).
- **Globally relevant** — best Western RPM exposure of any utility in this portfolio.
- **Genuine portfolio piece** — Workers + OPFS + WASM + PWA + TWA architecture is interview-class.
- **Zero hosting cost** — Cloudflare Pages free tier handles even iLovePDF-scale static assets.

**Risk:** competition is heavyweight (SmallPDF, iLovePDF spend on SEO). Mitigation: don't try to outrank them on "merge pdf"; **win the long tail** ("compress pdf to 200kb for ssc", "merge pdf for upsc application", "pdf to jpg high quality no upload") where they aren't focused.

### Weekend 1 — Ship the MVP
- Astro + Svelte islands scaffolding.
- Three tools: **Merge**, **Split**, **Rotate**. All pure `pdf-lib`, trivial bugs.
- Drag-and-drop, thumbnail preview (`pdfjs-dist`), download.
- 1 landing page per tool + a homepage. Lighthouse 95+ on each.
- Deploy to Cloudflare Pages. Custom domain.
- Privacy policy, ToS, cookie banner (for future AdSense).
- README + public GitHub repo.

**Goal:** something you can actually share by Sunday evening. No compression, no OCR, no auth. Just a clean, instant, privacy-first version of three things SmallPDF charges for.

### Weekend 2 — Compression + JPG ⇄ PDF
- Implement compression pipeline (Approach A: pdf-lib + canvas re-encode). Skip Ghostscript-WASM until v3 — too heavy for first iteration.
- Binary-search wrapper for **India size presets** (100/200/500 KB, 1/2 MB).
- JPG → PDF and PDF → JPG.
- Delete pages + reorder pages.
- 10 more programmatic landing pages (the size-target variants + jpg/pdf converters).
- File System Access API for "Save As" on supported browsers.

### Weekend 3 — Polish + Launch
- PWA manifest, Workbox precache, offline mode.
- Share-target manifest entry.
- Add page numbers, watermark, extract pages.
- 10 India-intent landing pages.
- ProductHunt + Show HN submission prep (write the copy, take screenshots, set up demo GIF).
- Apply for AdSense.

### Weekend 4–6 — Expansion
- TWA build via Bubblewrap, Play Store submission.
- OCR via `tesseract.js` (English + Hindi).
- Password remove (using @cantoo/pdf-lib).
- Form fill / flatten.
- Build out remaining ~150 programmatic landing pages.
- Chrome extension MVP.

### What to defer indefinitely
- PDF → Word / Excel (high-fidelity). Not viable client-side in 2026.
- Cloud sync, user accounts. Adds infra cost, kills the privacy story.
- AI summarization. Cute but distracts from the core utility narrative.

Ship Weekend 1's three tools by next Sunday. Real users in 6 weeks, AdSense revenue in 3 months, the architecture story in your interviews tomorrow.
