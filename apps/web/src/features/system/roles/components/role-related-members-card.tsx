import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { UserRound } from 'lucide-react'

export type RoleMemberPreview = {
  id: string
  name: string
  avatarUrl: string
  fallback: string
}

type RoleRelatedMembersCardProps = {
  members: RoleMemberPreview[]
  totalCount?: number
}

export function RoleRelatedMembersCard({ members, totalCount }: RoleRelatedMembersCardProps) {
  const total = totalCount ?? members.length
  const overflow = Math.max(0, total - members.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between items-center gap-2">
            关联成员
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <UserRound className="size-4 " /> {total}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无成员</p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            {members.map((member) => (
              <Tooltip key={member.id}>
                <TooltipTrigger>
                  <Avatar>
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : null}
                    <AvatarFallback>{member.fallback}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{member.name}</TooltipContent>
              </Tooltip>
            ))}

            {overflow > 0 ? (
              <div className="text-muted-foreground flex size-8 items-center justify-center rounded-full">
                +{overflow}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
