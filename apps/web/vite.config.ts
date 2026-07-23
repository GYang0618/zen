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
      alias: {
        '@zen/plugin-demo-notes/web': path.resolve(
          monorepoRoot,
          'plugins/demo-notes/src/web/index.ts'
        ),
        '@zen/plugin-notifications/web': path.resolve(
          monorepoRoot,
          'plugins/notifications/src/web/index.ts'
        ),
        '@zen/plugin-files/web': path.resolve(monorepoRoot, 'plugins/files/src/web/index.ts'),
        '@zen/plugin-jobs/web': path.resolve(monorepoRoot, 'plugins/jobs/src/web/index.ts')
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
