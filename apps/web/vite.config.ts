import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import cesium from 'vite-plugin-cesium'

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
      tsconfigPaths: true
    },
    server: {
      port: 3000,
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
