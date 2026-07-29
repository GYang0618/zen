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
}

export function RoleRelatedMembersCard({ members }: RoleRelatedMembersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between items-center gap-2">
            关联成员
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <UserRound className="size-4 " /> {members.length}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          {members.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger>
                <Avatar>
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback>{member.fallback}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{member.name}</TooltipContent>
            </Tooltip>
          ))}

          <div className="text-muted-foreground flex size-8 items-center justify-center rounded-full">
            +{members.length - 10}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
