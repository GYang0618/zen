import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zen/ui'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface DashboardCardProps {
  title: string
  subtitle?: string
  child?: string
}

export function DashboardCard({ props, children }: RendererProps<DashboardCardProps>) {
  return (
    <Card className="h-full w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{props.title}</CardTitle>
        {props.subtitle && <CardDescription className="text-xs">{props.subtitle}</CardDescription>}
      </CardHeader>
      {props.child && <CardContent>{children(props.child)}</CardContent>}
    </Card>
  )
}
