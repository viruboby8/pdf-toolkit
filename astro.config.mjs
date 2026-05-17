// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import pwa from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://pdftoolkit.app',
  integrations: [
    svelte(),
    sitemap(),
    pwa({
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
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '@': '/src' } },
  },
});