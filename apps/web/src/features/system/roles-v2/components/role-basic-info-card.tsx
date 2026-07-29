import { Card, CardContent, CardHeader, CardTitle } from '@zen/ui'

import type { ReactNode } from 'react'

export type RoleBasicInfoItem = {
  icon: ReactNode
  label: string
  value: ReactNode
}

type RoleBasicInfoCardProps = {
  items: RoleBasicInfoItem[]
}

export function RoleBasicInfoCard({ items }: RoleBasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                {item.icon}
                {item.label}
              </span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
