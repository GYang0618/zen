import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../api/swagger.json',
  output: './src/api-client',
  plugins: ['@hey-api/sdk', '@hey-api/client-fetch', 'zod']
})
