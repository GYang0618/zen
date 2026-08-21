import path from 'node:path'
import { fileURLToPath } from 'node:url'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import cesium from 'vite-plugin-cesium'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(appDir, '../..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true
      }),
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
      cesium()
    ],
    resolve: {
      tsconfigPaths: true,
      // Plugin web entries live outside apps/web/src, so tsconfig paths do not
      // apply. Pin to source — @zen/shared dist is CJS and Vite cannot named-import it.
      alias: {
        '@zen/shared': path.resolve(monorepoRoot, 'packages/shared/src/index.ts')
      }
    },
    server: {
      port: 3000,
      fs: {
        allow: [monorepoRoot]
      },
      proxy: {
        '/oss': {
          target: env.VITE_APP_OSS_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/oss/, '')
        }
      }
    }
  }
})
