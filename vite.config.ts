import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * The preview sits behind an HTTP Basic sign-in. Safari does not send those
 * credentials for <script type="module" crossorigin> and <link crossorigin>,
 * so the app's own files came back 401 and the sign-in prompt looped.
 * Same-origin files do not need the attribute; drop it.
 */
const sameOriginAssets = (): Plugin => ({
  name: 'same-origin-assets',
  enforce: 'post',
  transformIndexHtml: (html) => html.replace(/(<(?:script|link)\b[^>]*?)\s+crossorigin(?:=(?:""|"anonymous"))?(?=[\s>])/g, '$1'),
})

export default defineConfig({
  plugins: [react(), sameOriginAssets()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    // "app-" names: browsers that cached the earlier 401s for index-*.js/css fetch these fresh.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/app-[name]-[hash].js',
        assetFileNames: (a) => (a.names?.some((n) => n.endsWith('.css')) ? 'assets/app-[hash][extname]' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
})
