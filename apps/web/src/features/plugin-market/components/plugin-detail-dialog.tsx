import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@zen/ui'
import { ArrowUpRight, Check, ShieldCheck } from 'lucide-react'

import type { Plugin } from '../types'

type PluginDetailDialogProps = {
  plugin: Plugin | null
  installed: boolean
  onOpenChange: (open: boolean) => void
  onToggle: (id: string) => void
}

export function PluginDetailDialog({
  plugin,
  installed,
  onOpenChange,
  onToggle
}: PluginDetailDialogProps) {
  if (!plugin) return null
  const Icon = plugin.icon
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                plugin.iconClassName
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-1.5">
                {plugin.name}
                {plugin.verified && <ShieldCheck className="size-4 text-primary" />}
              </DialogTitle>
              <DialogDescription className="mt-1">
                由 {plugin.publisher} 发布 · v{plugin.version} · {plugin.updated} 更新
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <p className="leading-6 text-muted-foreground">{plugin.description}</p>
          <div>
            <p className="mb-2 text-sm font-medium">包含能力</p>
            <div className="flex flex-wrap gap-2">
              {plugin.capabilities.map((capability) => (
                <Badge key={capability} variant="secondary">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/60 p-3 text-sm">
            <Metric label="安装量" value={plugin.installs} />
            <Metric label="版本" value={plugin.version} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">
            <ArrowUpRight data-icon="inline-start" />
            查看文档
          </Button>
          <Button variant={installed ? 'outline' : 'default'} onClick={() => onToggle(plugin.id)}>
            {installed ? (
              <>
                <Check data-icon="inline-start" />
                已安装
              </>
            ) : (
              '安装插件'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  )
}
