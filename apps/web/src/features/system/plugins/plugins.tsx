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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Textarea
} from '@zen/ui'
import { Puzzle, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfigDrawer, ConfirmDialog, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { Header, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'
import { EmptyState } from '@/features/system/config/components'

import {
  useActivatePlugin,
  useDeactivatePlugin,
  usePluginsQuery,
  useUpdatePluginConfig
} from './queries'

import type { PluginListItem } from './api'

export function PluginsPage() {
  const { data, isLoading } = usePluginsQuery()
  const activate = useActivatePlugin()
  const deactivate = useDeactivatePlugin()
  const updateConfig = useUpdatePluginConfig()
  const [editing, setEditing] = useState<PluginListItem | null>(null)
  const [configText, setConfigText] = useState('{}')
  const [deactivateTarget, setDeactivateTarget] = useState<PluginListItem | null>(null)

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(plugin)
                          setConfigText(JSON.stringify(plugin.config ?? {}, null, 2))
                        }}
                      >
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

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插件配置 · {editing?.name}</DialogTitle>
            <DialogDescription>以 JSON 维护插件 Feature Flag，保存后立即生效</DialogDescription>
          </DialogHeader>
          <Textarea
            className="min-h-40 font-mono text-sm"
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            aria-label="插件 JSON 配置"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              取消
            </Button>
            <Button
              disabled={updateConfig.isPending || !editing}
              onClick={async () => {
                if (!editing) return
                try {
                  const parsed = JSON.parse(configText) as Record<string, unknown>
                  await updateConfig.mutateAsync({ id: editing.id, config: parsed })
                  setEditing(null)
                } catch {
                  toast.error('JSON 格式无效')
                }
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
