import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  ScrollArea
} from '@zen/ui'
import { ArrowRight, Laptop, Moon, Sun } from 'lucide-react'
import { useMemo } from 'react'

import { buildNavGroupsFromRouteTree } from '@/components/layouts/build-nav-from-routes'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import { fetchActivePluginIds } from '@/features/system/plugins/api'
import { useAuthStore } from '@/stores'

import type { RouteTreeNode } from '@/components/layouts/build-nav-from-routes'
import type { NavItem, NavLink } from '@/components/layouts/types'

function flattenNavLinks(items: NavItem[]): NavLink[] {
  const links: NavLink[] = []
  for (const item of items) {
    if ('items' in item && item.items) {
      for (const sub of item.items) {
        links.push({
          title: sub.title,
          url: sub.url,
          external: sub.external,
          icon: sub.icon,
          permissions: sub.permissions,
          badge: sub.badge,
          show: sub.show
        })
      }
      continue
    }
    if ('url' in item && item.url) {
      links.push(item)
    }
  }
  return links
}

export function CommandMenu() {
  const navigate = useNavigate()
  const router = useRouter()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const permissions = useAuthStore((state) => state.user?.permissions ?? [])
  const activePluginsQuery = useQuery({
    queryKey: ['plugins', 'active-ids'],
    queryFn: () => fetchActivePluginIds(true),
    staleTime: 30_000
  })

  const navGroups = useMemo(() => {
    return buildNavGroupsFromRouteTree(
      router.routeTree as RouteTreeNode,
      permissions,
      activePluginsQuery.data
    )
  }, [router.routeTree, permissions, activePluginsQuery.data])

  const runCommand = (command: () => unknown) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="输入命令或搜索..." />
        <CommandList>
          <ScrollArea type="hover" className="h-72 pe-1">
            <CommandEmpty>未找到结果。</CommandEmpty>
            {navGroups.map((group) => {
              const links = flattenNavLinks(group.items)
              if (links.length === 0) return null
              return (
                <CommandGroup key={group.title} heading={group.title}>
                  {links.map((navItem) => (
                    <CommandItem
                      key={`${navItem.url}-${navItem.title}`}
                      value={navItem.title}
                      onSelect={() => {
                        runCommand(() => navigate({ to: navItem.url }))
                      }}
                    >
                      <div className="flex size-4 items-center justify-center">
                        <ArrowRight className="size-2 text-muted-foreground/80" />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
            <CommandSeparator />
            <CommandGroup heading="主题">
              <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                <Sun /> <span>浅色</span>
                <CommandShortcut>⌘L</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                <Moon /> <span>深色</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                <Laptop /> <span>系统</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </ScrollArea>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
