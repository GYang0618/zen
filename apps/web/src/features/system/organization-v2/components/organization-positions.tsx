import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  Field,
  FieldLabel,
  Progress,
  Separator
} from '@zen/ui'
import { CalendarDays, PanelsTopLeft } from 'lucide-react'

import type { Position } from '../type'

export function OrganizationPositions({ data }: { data: Position[] }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
        {data.map((item) => (
          <Card key={item.id} className="gap-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="size-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
                    <PanelsTopLeft className="size-4" />
                  </div>
                  <span className="text-xs">{item.code}</span>
                </div>
                <Badge variant="outline">招聘中</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h2 className="font-semibold text-base">{item.name}</h2>
              <p className="text-muted-foreground mt-1">资深 · P6</p>
              <p className="text-muted-foreground mt-3 line-clamp-2 min-h-10 text-sm leading-5">
                {item.description}
              </p>
              <div className="flex item-center justify-between mt-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" /> 2026-08-0{' '}
                </span>
                <AvatarGroup className="grayscale">
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                    <AvatarFallback>LR</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                    <AvatarFallback>ER</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+3</AvatarGroupCount>
                </AvatarGroup>
              </div>
              <Separator className="mt-4 mb-3" />
              <Field>
                <FieldLabel>
                  <span className="text-sm">10%</span>
                  <span className="text-muted-foreground text-xs ml-auto">1/10 在岗 · 9 空缺</span>
                </FieldLabel>
                <Progress value={40} />
              </Field>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
