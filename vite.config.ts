import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH || '/',
  resolve: { alias: mode === 'standalone' ? [{ find: 'virtual:pwa-register/react', replacement: new URL('./src/lib/pwa-standalone.ts', import.meta.url).pathname }] : [] },
  plugins: [react(), tailwindcss(), ...(mode === 'standalone' ? [] : [VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
    manifest: {
      name: 'Sage · Clinical reference', short_name: 'Sage',
      description: 'A fictional-case prototype for traceable clinical guideline reference. Medical verification pending.',
      theme_color: '#2e5145', background_color: '#f8f9f6', display: 'standalone',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      cleanupOutdatedCaches: true,
      navigateFallback: 'index.html',
      runtimeCaching: []
    }
  })])],
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'] }
}));
