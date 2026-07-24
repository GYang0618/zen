import { Link, useLocation } from '@tanstack/react-router'
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@zen/ui'
import { ChevronRight, ExternalLink } from 'lucide-react'

import type { LinkProps } from '@tanstack/react-router'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { NavCollapsible, NavGroup as NavGroupProps, NavItem, NavLink } from '../types'

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = 'url' in item && item.url ? `${item.title}-${item.url}` : item.title

          if (!item.items) return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed' && !isMobile)
            return <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
}

type NavAnchorProps = {
  url: LinkProps['to'] | (string & {})
  external?: boolean
  onNavigate?: () => void
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'children'>

function NavAnchor({ url, external, onNavigate, className, children, ...rest }: NavAnchorProps) {
  if (external) {
    return (
      <a
        href={String(url)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={url} className={className} onClick={onNavigate} {...rest}>
      {children}
    </Link>
  )
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={!item.external && checkIsActive(href, item)}
        tooltip={item.title}
      >
        <NavAnchor url={item.url} external={item.external} onNavigate={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.external && <ExternalLink className="ms-auto size-3.5 opacity-60" aria-hidden />}
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </NavAnchor>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({ item, href }: { item: NavCollapsible; href: string }) {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={!subItem.external && checkIsActive(href, subItem)}
                >
                  <NavAnchor
                    url={subItem.url}
                    external={subItem.external}
                    onNavigate={() => setOpenMobile(false)}
                  >
                    <span>{subItem.title}</span>
                    {subItem.external && (
                      <ExternalLink className="ms-auto size-3 opacity-60" aria-hidden />
                    )}
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                  </NavAnchor>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({ item, href }: { item: NavCollapsible; href: string }) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={checkIsActive(href, item)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <NavAnchor
                url={sub.url}
                external={sub.external}
                className={!sub.external && checkIsActive(href, sub) ? 'bg-secondary' : ''}
              >
                <span className="max-w-52 text-wrap">{sub.title}</span>
                {sub.external && <ExternalLink className="ms-auto size-3 opacity-60" aria-hidden />}
                {sub.badge && <span className="ms-auto text-xs">{sub.badge}</span>}
              </NavAnchor>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(
  href: string,
  item:
    | NavItem
    | { url?: LinkProps['to'] | (string & {}); items?: { url: LinkProps['to'] | (string & {}) }[] },
  mainNav = false
) {
  const url = typeof item.url === 'string' ? item.url : undefined
  if (url?.startsWith('http://') || url?.startsWith('https://')) return false

  return (
    (!!url && href === url) ||
    (!!url && href.split('?')[0] === url) ||
    !!item.items?.some((child) => child.url === href) ||
    (!!mainNav && !!url && href.split('/')[1] !== '' && href.split('/')[1] === url.split('/')[1])
  )
}
