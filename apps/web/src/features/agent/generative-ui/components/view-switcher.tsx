import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface ViewSwitcherProps {
  title: string
  views: {
    key: string
    icon: LucideIcon
    render: ReactNode
  }[]
  description?: string
  loading?: boolean
}

export function ViewSwitcher({ title, description, loading = false, views }: ViewSwitcherProps) {
  return (
    <Tabs className="p-2" defaultValue={views[0]?.key}>
      <Card>
        <CardHeader>
          {loading ? (
            <Skeleton className="h-8 w-2/3" />
          ) : (
            <>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
              <CardAction>
                <TabsList>
                  {views.map((view) => (
                    <TabsTrigger key={view.key} value={view.key}>
                      <view.icon />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardAction>
            </>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : (
            views.map((view) => (
              <TabsContent key={view.key} value={view.key}>
                {view.render}
              </TabsContent>
            ))
          )}
        </CardContent>
      </Card>
    </Tabs>
  )
}
