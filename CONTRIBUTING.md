# Contributing to PDF Toolkit

## Requirements

- Node 22+
- `npm install` to install deps

## Development

```bash
npm run dev     # dev server at localhost:4321
npm run build   # production build → dist/
```

## Key rule: no server-side code, ever

This is the privacy contract. All file processing must run in the user's browser. Never add any code that sends file data to a server. This constraint is verifiable via DevTools → Network.

## Branch naming

`feat/your-feature` for new features, `fix/issue-description` for bugs.

## Lint

```bash
npm run astro check   # Astro + TypeScript checks
```

## Opening a PR

Describe what you changed and why. Include a before/after for UI changes. The CI build (`npm run build`) must pass.
