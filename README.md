# PDF Toolkit

**Free, unlimited PDF tools that never leave your browser.**

> Merge · Split · Rotate · Compress · JPG↔PDF · OCR — all client-side, all private.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with Astro](https://img.shields.io/badge/built%20with-Astro-ff5a03.svg)](https://astro.build)

## Why this exists

Every major PDF tool (SmallPDF, iLovePDF) uploads your files to a server. That's a problem when your file is an Aadhaar card, a bank statement, or a legal contract. PDF Toolkit does everything locally — your file never leaves your device. You can verify this in DevTools → Network: zero outbound requests during any operation.

No daily limits. No watermarks. No paywalls.

## Features (Phase 1)

- **Merge PDFs** — drag to reorder, then combine
- **Split PDF** — every N pages or a specific page range
- **Rotate PDF** — 90°, 180°, or 270° applied to all pages

Coming soon: page reorder/delete/extract, compression with India size presets (100/200/500 KB), JPG↔PDF, OCR, password handling.

## Architecture

Static-first Astro site. Svelte 5 islands hydrate only on tool pages. Heavy operations run in dedicated Web Workers via Comlink. Large files stream into OPFS — never bloating the JS heap. Compression uses pdf-lib + mozjpeg-wasm with binary search over JPEG quality to hit exact size targets (used by Indian govt portals: UPSC, SSC, Railway). Workbox precaches everything for offline use. Same codebase ships as an Android TWA.

**Verifiable zero network calls during processing. Privacy as architecture, not policy.**

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Astro 5 (static-first) |
| UI | Svelte 5 (islands) |
| PDF | pdf-lib 1.x + pdfjs-dist 4.x |
| Worker RPC | Comlink 4.x |
| Large-file staging | OPFS |
| Compression | @jsquash/jpeg (mozjpeg WASM) |
| OCR | Tesseract.js 6 |
| PWA | Workbox via @vite-pwa/astro |
| Hosting | Cloudflare Pages |
| Android | Bubblewrap TWA |

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
