import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@zen/ui'

import { useLayout } from '@/context/layout-provider'

import { ModeSwitcher } from './components/mode-switcher'

import type { ReactNode } from 'react'

type ShellSidebarScroll = 'parent' | 'self'

type ShellSidebarFrameProps = {
  scroll: ShellSidebarScroll
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function ShellSidebarFrame({ scroll, header, children, footer }: ShellSidebarFrameProps) {
  const { collapsible, variant } = useLayout()

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <ModeSwitcher />
        {header}
      </SidebarHeader>
      <SidebarContent className={scroll === 'self' ? 'overflow-hidden' : undefined}>
        {children}
      </SidebarContent>
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  )
}
