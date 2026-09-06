import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton
} from '@zen/ui'
import { Puzzle, Settings2 } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { EmptyState } from '@/components/empty-state'
import { Header, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { PluginConfigDialog } from './plugin-config-dialog'
import { useActivatePlugin, useDeactivatePlugin, usePluginsQuery } from './queries'

import type { PluginListItem } from './api'

export function PluginsPage() {
  const { data, isLoading } = usePluginsQuery()
  const activate = useActivatePlugin()
  const deactivate = useDeactivatePlugin()
  const [editing, setEditing] = useState<PluginListItem | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<PluginListItem | null>(null)

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <Card>
            <EmptyState
              icon={Puzzle}
              title="未发现插件"
              description="编译期注册的插件会显示在此处"
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data?.map((plugin) => {
              const active = plugin.status === 'active'
              return (
                <Card key={plugin.id} className="transition-shadow hover:shadow-sm">
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-1">
                        <CardTitle className="truncate">{plugin.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{plugin.id}</CardDescription>
                      </div>
                      <Badge variant={active ? 'default' : 'outline'}>
                        {active ? '已启用' : '未启用'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">v{plugin.version}</Badge>
                      {plugin.dependsOn.length > 0 ? (
                        <Badge variant="outline">依赖 {plugin.dependsOn.length}</Badge>
                      ) : (
                        <Badge variant="outline">无依赖</Badge>
                      )}
                    </div>
                    {plugin.dependsOn.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        依赖：{plugin.dependsOn.join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">可独立启用，无需其他插件</p>
                    )}
                  </CardContent>
                  <Can permission={PermissionCode.PLUGIN_MANAGE}>
                    <CardFooter className="justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(plugin)}>
                        <Settings2 data-icon="inline-start" />
                        配置
                      </Button>
                      {active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deactivate.isPending}
                          onClick={() => setDeactivateTarget(plugin)}
                        >
                          停用
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={activate.isPending}
                          onClick={() => activate.mutate(plugin.id)}
                        >
                          启用
                        </Button>
                      )}
                    </CardFooter>
                  </Can>
                </Card>
              )
            })}
          </div>
        )}
      </Main>

      {editing ? (
        <PluginConfigDialog
          key={editing.id}
          plugin={editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
        title="停用插件？"
        desc={
          deactivateTarget
            ? `停用「${deactivateTarget.name}」后，依赖该插件的能力将不可用，直到重新启用。`
            : ''
        }
        confirmText="确认停用"
        cancelBtnText="取消"
        destructive
        isLoading={deactivate.isPending}
        handleConfirm={() => {
          if (!deactivateTarget) return
          deactivate.mutate(deactivateTarget.id, {
            onSuccess: () => setDeactivateTarget(null)
          })
        }}
      />
    </>
  )
}
