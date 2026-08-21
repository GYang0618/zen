import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from '@zen/ui'

import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />

      {/* <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />
            }
          ]}
        /> */}
    </>
  )
}
