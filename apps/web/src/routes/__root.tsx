import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@zen/ui'

import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

import type { AppRouterContext } from '@/types/router-context'

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}
