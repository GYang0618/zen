import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'

import '@/styles/index.css'

import { DirectionProvider } from '@/context/direction-provider'
import type { RouterMeta } from '@/types/router'
import { ThemeProvider } from './context/theme-provider'

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface StaticDataRouteOption extends RouterMeta {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DirectionProvider>
        <RouterProvider router={router} />
      </DirectionProvider>
    </ThemeProvider>
  </StrictMode>
)
