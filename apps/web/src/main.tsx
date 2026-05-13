import '@/config/env'
import '@/styles/index.css'

import { CopilotKitProvider } from '@copilotkit/react-core/v2'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { useEnv } from '@/config/env'
import { queryClient } from '@/lib/query-client'

import { ThemeProvider } from './context/theme-provider'
import { router } from './router'

function App() {
  const { copilotKitApi } = useEnv()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CopilotKitProvider runtimeUrl={copilotKitApi} useSingleEndpoint={false}>
          <RouterProvider router={router} />
        </CopilotKitProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
