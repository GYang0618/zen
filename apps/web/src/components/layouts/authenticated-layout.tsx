import { Outlet } from '@tanstack/react-router'
import { cn, SidebarInset, SidebarProvider, TooltipProvider } from '@zen/ui'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { getCookie } from '@/lib'
import { AppSidebar } from './app-sidebar'

export function AuthenticatedLayout() {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <LayoutProvider>
          <TooltipProvider delayDuration={0}>
            <AppSidebar />

            <SidebarInset
              className={cn(
                // Set content container, so we can use container queries
                '@container/content',

                // If layout is fixed, set the height
                // to 100svh to prevent overflow
                'has-data-[layout=fixed]:h-svh',

                // If layout is fixed and sidebar is inset,
                // set the height to 100svh - spacing (total margins) to prevent overflow
                'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
              )}
            >
              <Outlet />
            </SidebarInset>
          </TooltipProvider>
        </LayoutProvider>
      </SidebarProvider>
    </SearchProvider>
  )
}
