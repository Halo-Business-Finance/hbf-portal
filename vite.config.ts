import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline', // Inline SW registration to avoid blocking
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Halo Business Finance',
        short_name: 'HBF',
        description: 'Business loan application and management platform',
        theme_color: '#0F172A',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        // Don't include service worker files themselves in precache
        globIgnores: ['**/sw.js', '**/workbox-*.js'],
        // Add cache versioning - increment this when you want to force cache refresh
        cacheId: 'hbf-v1',
        runtimeCaching: [
          // Cache JavaScript chunks with StaleWhileRevalidate
          {
            urlPattern: /\/assets\/.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'hbf-v1-js-chunks',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache CSS files with StaleWhileRevalidate
          {
            urlPattern: /\/assets\/.*\.css$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'hbf-v1-css',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hbf-v1-google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hbf-v1-gstatic-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hbf-v1-api',
              networkTimeoutSeconds: 10, // Fallback to cache after 10s
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hbf-v1-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        // Enable navigation preload for faster page loads
        navigationPreload: true,
        // Clean up old caches automatically
        cleanupOutdatedCaches: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
