import { Separator } from '@zen/ui'

import type { ReactNode } from 'react'

type SettingsPageHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
}

export function SettingsPageHeader({ title, description, actions }: SettingsPageHeaderProps) {
  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <Separator />
    </div>
  )
}

