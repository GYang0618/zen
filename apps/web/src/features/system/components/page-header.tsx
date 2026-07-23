import type { ReactNode } from 'react'

type SystemPageHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
}

export function SystemPageHeader({ title, description, actions }: SystemPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
