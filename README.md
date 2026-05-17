# PDF Toolkit

**Free, unlimited PDF tools that never leave your browser.**

> Merge · Split · Rotate · Compress · JPG↔PDF · OCR · Passwords — all client-side, all private.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with Astro](https://img.shields.io/badge/built%20with-Astro-ff5a03.svg)](https://astro.build)

## Why this exists

Every major PDF tool (SmallPDF, iLovePDF) uploads your files to a server. That's a problem when your file is an Aadhaar card, a bank statement, or a legal contract. PDF Toolkit does everything locally — your file never leaves your device. You can verify this in DevTools → Network: zero outbound requests during any operation.

No daily limits. No watermarks. No paywalls.

## Features

| Tool | What it does |
|---|---|
| **Merge PDFs** | Drag to reorder, then combine into one file |
| **Split PDF** | Every N pages, or a specific page range |
| **Rotate PDF** | 90° / 180° / 270°, applied to any or all pages |
| **Reorder pages** | Drag page thumbnails to any order |
| **Delete pages** | Click thumbnails to select and remove |
| **Extract pages** | Pick specific pages and save as a new PDF |
| **Compress PDF** | Binary-search to exact size target (100 KB / 200 KB / 500 KB / 1 MB / 2 MB — plus custom) |
| **JPG → PDF** | Combine JPG, PNG, or WebP images into a multi-page PDF |
| **PDF → JPG** | Render each page to JPEG at 2× quality |
| **OCR PDF** | Extract text from scanned PDFs via Tesseract.js |
| **Remove password** | Decrypt a password-protected PDF locally |

## Architecture

Static-first Astro site. Svelte 5 islands hydrate only on tool pages. Heavy operations run in dedicated Web Workers via Comlink. Large files stream into OPFS — never bloating the JS heap. Compression uses pdf-lib + mozjpeg-wasm with binary search over JPEG quality to hit exact size targets (used by Indian govt portals: UPSC, SSC, Railway). Workbox precaches everything for offline use. Same codebase ships as an Android TWA.

**Verifiable zero network calls during processing. Privacy as architecture, not policy.**

## SEO scale

68 statically-generated pages driven by Astro Content Collections:
- 11 tool hub pages
- 10 India government intent pages (UPSC, SSC, Railway, PAN, Aadhaar, KYC, ITR…)
- 10 compression size-target pages (100 KB → 50 MB)
- 8 quality / modifier pages (no-upload, offline, no-watermark…)
- 5 alternative / comparison pages
- 7 long-tail combination pages
- Blog at `/blog/` with practical guides

Human-readable sitemap: [/sitemap.html](https://pdftoolkit.app/sitemap.html/)

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Astro 5.18.1 (static-first) |
| UI | Svelte 5 (islands) |
| PDF | pdf-lib 1.x + pdfjs-dist 4.x |
| Worker RPC | Comlink 4.x |
| Large-file staging | OPFS |
| Compression | @jsquash/jpeg (mozjpeg WASM) |
| OCR | Tesseract.js 7 |
| Content | Astro Content Collections + MDX |
| PWA | Workbox via @vite-pwa/astro |
| Hosting | Railway (static serve via `npx serve`) |
| Android | Bubblewrap TWA (Phase 6) |

## Quick start

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
```

Node 22+ required.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Open issues on GitHub for bugs or feature requests.

## License

[MIT](LICENSE)
