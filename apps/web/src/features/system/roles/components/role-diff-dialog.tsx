import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@zen/ui'
import { GitCompare, Loader2 } from 'lucide-react'

import { dataScopeConfig } from '../data/data'

import type { PermissionGroup, RoleDataScope } from '@zen/shared'

type RoleDiffDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleName: string
  added: string[]
  removed: string[]
  scopeChanged: boolean
  fromScope: RoleDataScope
  toScope: RoleDataScope
  groups: PermissionGroup[]
  isSaving?: boolean
  onConfirm: () => void
}

function resolvePermissionLabel(code: string, groups: PermissionGroup[]) {
  for (const group of groups) {
    const found = group.permissions.find((item) => item.code === code)
    if (found) return `${found.name} (${code})`
  }
  return code
}

export function RoleDiffDialog({
  open,
  onOpenChange,
  roleName,
  added,
  removed,
  scopeChanged,
  fromScope,
  toScope,
  groups,
  isSaving = false,
  onConfirm
}: RoleDiffDialogProps) {
  const hasChanges = added.length > 0 || removed.length > 0 || scopeChanged

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="size-4 text-primary" aria-hidden />
            确认权限变更策略 (Diff)
          </DialogTitle>
          <DialogDescription>
            即将对角色「{roleName}」提交以下配置 Diff，保存后立即对关联用户生效。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-60 space-y-3 overflow-y-auto pe-1 text-xs">
          {!hasChanges ? <p className="text-muted-foreground">没有检测到可提交的变更。</p> : null}

          {added.length > 0 ? (
            <section className="space-y-1">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                + 新增的权限策略 ({added.length}):
              </span>
              <ul className="space-y-1 ps-3">
                {added.map((code) => (
                  <li
                    key={code}
                    className="rounded border border-emerald-500/20 bg-emerald-500/10 p-1.5 font-mono text-emerald-700 dark:text-emerald-300"
                  >
                    {resolvePermissionLabel(code, groups)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {removed.length > 0 ? (
            <section className="space-y-1 pt-2">
              <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                - 移除的权限策略 ({removed.length}):
              </span>
              <ul className="space-y-1 ps-3">
                {removed.map((code) => (
                  <li
                    key={code}
                    className="rounded border border-rose-500/20 bg-rose-500/10 p-1.5 font-mono text-rose-700 dark:text-rose-300"
                  >
                    {resolvePermissionLabel(code, groups)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {scopeChanged ? (
            <section className="pt-2">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Δ 数据作用域变更:
              </span>
              <div className="mt-1 rounded border border-amber-500/20 bg-amber-500/10 p-2 font-mono">
                {dataScopeConfig[fromScope].label} ➔ {dataScopeConfig[toScope].label}
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            再想想
          </Button>
          <Button type="button" disabled={!hasChanges || isSaving} onClick={onConfirm}>
            {isSaving ? <Loader2 className="animate-spin" /> : '确认提交生效'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
