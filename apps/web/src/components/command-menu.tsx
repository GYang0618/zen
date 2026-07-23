import { useMemo } from 'react'
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

import { buildNavGroupsFromRoutes } from '@/components/layouts/build-nav-from-routes'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import { useAuthStore } from '@/stores'

import type { RouterMeta } from '@/types/router'

export function CommandMenu() {
  const navigate = useNavigate()
  const router = useRouter()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const permissions = useAuthStore((state) => state.user?.permissions ?? [])

  const navGroups = useMemo(() => {
    const routes = Object.values(router.routesById).map((route) => ({
      fullPath: route.fullPath,
      staticData: route.options.staticData as RouterMeta | undefined
    }))
    return buildNavGroupsFromRoutes(routes, permissions)
  }, [router.routesById, permissions])

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
            {navGroups.map((group) => (
              <CommandGroup key={group.title} heading={group.title}>
                {group.items.map((navItem) => {
                  if (!('url' in navItem) || !navItem.url) return null
                  return (
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
                  )
                })}
              </CommandGroup>
            ))}
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
