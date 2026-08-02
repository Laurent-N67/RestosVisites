import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'RestosVisites',
        short_name: 'RestosVisites',
        description: 'Carnet de visites de restaurants : notez et retrouvez vos adresses.',
        theme_color: '#ff6740',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Données liées à la session/l'utilisateur courant : jamais mises
            // en cache, pour éviter de servir une session ou des favoris
            // périmés après connexion/déconnexion (voir AuthContext.logout
            // qui vide aussi le cache 'api-cache' par précaution).
            urlPattern:
              /^https?:\/\/[^/]+\/api\/(auth|favoris|utilisateurs)(\/.*)?$/,
            method: 'GET',
            handler: 'NetworkOnly',
          },
          {
            urlPattern:
              /^https?:\/\/[^/]+\/api\/(?!auth|favoris|utilisateurs).*/,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 6, // 6 heures
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
