import { Button, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@zen/ui'
import { Check, MoreHorizontal, ShieldCheck } from 'lucide-react'

import type { MouseEventHandler } from 'react'
import type { Plugin } from '../types'

type PluginCardProps = {
  plugin: Plugin
  installed: boolean
  onToggle: (id: string) => void
  onSelect: (plugin: Plugin) => void
}

export function FeaturedPluginCard({ plugin, installed, onToggle, onSelect }: PluginCardProps) {
  return (
    <article className="flex min-w-0 gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <PluginIcon plugin={plugin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <button className="min-w-0 text-left" type="button" onClick={() => onSelect(plugin)}>
          <PluginTitle plugin={plugin} />
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {plugin.description}
          </p>
        </button>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {plugin.publisher} · {plugin.installs} 安装
          </span>
          <PluginAction installed={installed} onClick={() => onToggle(plugin.id)} />
        </div>
      </div>
    </article>
  )
}

export function PluginCard({ plugin, installed, onToggle, onSelect }: PluginCardProps) {
  return (
    <article className="flex min-h-58 flex-col rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <PluginIcon plugin={plugin} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button aria-label={`${plugin.name} 更多操作`} variant="ghost" size="icon-sm" />
              }
            >
              <MoreHorizontal />
            </TooltipTrigger>
            <TooltipContent>更多操作</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <button type="button" onClick={() => onSelect(plugin)} className="mt-3 text-left">
        <PluginTitle plugin={plugin} />
        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {plugin.description}
        </p>
      </button>
      <div className="mt-auto pt-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{plugin.category}</span>
          <span>{plugin.installs} 安装</span>
        </div>
        <PluginAction installed={installed} onClick={() => onToggle(plugin.id)} />
      </div>
    </article>
  )
}

function PluginTitle({ plugin }: { plugin: Plugin }) {
  return (
    <div className="flex items-center gap-1.5">
      <h4 className="truncate font-medium">{plugin.name}</h4>
      {plugin.verified && <ShieldCheck className="size-3.5 shrink-0 text-primary" />}
    </div>
  )
}

function PluginIcon({ plugin }: { plugin: Plugin }) {
  const Icon = plugin.icon
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
        plugin.iconClassName
      )}
    >
      <Icon className="size-5" />
    </div>
  )
}

function PluginAction({
  installed,
  onClick
}: {
  installed: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <Button variant={installed ? 'outline' : 'default'} size="sm" onClick={onClick}>
      {installed ? (
        <>
          <Check data-icon="inline-start" />
          已安装
        </>
      ) : (
        '安装'
      )}
    </Button>
  )
}
