import '@/config/env'
import '@/styles/index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { queryClient } from '@/lib/query-client'
import { initAuthTokenRefreshScheduler } from '@/lib/request'

import { BaseColorProvider } from './context/base-color-provider'
import { BrandColorProvider } from './context/brand-color-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { UiStyleProvider } from './context/ui-style-provider'
import { router } from './router'

initAuthTokenRefreshScheduler()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BaseColorProvider>
          <BrandColorProvider>
            <FontProvider>
              <UiStyleProvider>
                <RouterProvider router={router} />
              </UiStyleProvider>
            </FontProvider>
          </BrandColorProvider>
        </BaseColorProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
