import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import {
  BriefcaseBusiness,
  CalendarClock,
  Filter,
  MoreHorizontal,
  Search,
  UsersRound
} from 'lucide-react'
import { useMemo, useState } from 'react'

import type { OrganizationNode } from '../data'

const mockPositions = [
  { name: '产品总监', code: 'POS-PD-01', headcount: 1, active: 1, status: '已满编' },
  { name: '高级产品经理', code: 'POS-PM-03', headcount: 5, active: 4, status: '招聘中' },
  { name: '产品经理', code: 'POS-PM-02', headcount: 8, active: 7, status: '招聘中' },
  { name: '高级交互设计师', code: 'POS-UX-03', headcount: 3, active: 3, status: '已满编' },
  { name: '用户研究员', code: 'POS-UR-02', headcount: 2, active: 1, status: '招聘中' }
]

const mockChanges = [
  {
    content: '新增岗位「高级产品经理」',
    operator: '陈予安',
    date: '2026-07-29 09:18',
    type: '岗位变更'
  },
  {
    content: '任命林清禾为产品一部负责人',
    operator: '周明远',
    date: '2026-07-28 16:42',
    type: '负责人变更'
  },
  {
    content: '用户体验部组织编码更新',
    operator: '苏晚晴',
    date: '2026-07-24 18:28',
    type: '信息变更'
  },
  {
    content: '产品二部编制由 26 调整为 30',
    operator: '沈知微',
    date: '2026-07-22 11:05',
    type: '编制变更'
  }
]

export function OrganizationMembers({ organization }: { organization: OrganizationNode }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('members')
  const filteredMembers = useMemo(
    () =>
      organization.members.filter((member) =>
        `${member.name}${member.role}${member.location}`.includes(query)
      ),
    [organization.members, query]
  )

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-w-0">
      <Card className="min-w-0 rounded-2xl">
        <CardHeader className="gap-1 border-b pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>组织成员</CardTitle>
              <CardDescription className="mt-1">查看当前组织的人员与岗位分布</CardDescription>
            </div>
            <Button variant="outline">
              <Filter data-icon="inline-start" /> 筛选
            </Button>
          </div>
          <TabsList variant="line" className="mt-4">
            <TabsTrigger value="members">
              <UsersRound data-icon="inline-start" /> 成员 ({organization.memberCount})
            </TabsTrigger>
            <TabsTrigger value="positions">
              <BriefcaseBusiness data-icon="inline-start" /> 岗位 (18)
            </TabsTrigger>
            <TabsTrigger value="changes">
              <CalendarClock data-icon="inline-start" /> 变更记录
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <TabsContent value="members" className="mt-0">
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <InputGroup className="w-full sm:w-72">
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索姓名、岗位或地点"
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <span className="text-xs text-muted-foreground">
              已展示 {filteredMembers.length} 名成员
            </span>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[34%]">成员</TableHead>
                  <TableHead>岗位 / 职级</TableHead>
                  <TableHead>工作地点</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{member.role}</span>
                        <span className="text-xs text-muted-foreground">{member.level}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.status === '在职' ? 'outline' : 'secondary'}
                        className={cn(
                          member.status === '在职' && 'border-primary/30 bg-primary/5 text-primary'
                        )}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`查看${member.name}更多操作`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredMembers.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                没有找到匹配成员
              </p>
            )}
          </CardContent>
        </TabsContent>
        <TabsContent value="positions" className="mt-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>岗位名称</TableHead>
                  <TableHead>岗位编码</TableHead>
                  <TableHead>编制</TableHead>
                  <TableHead>在岗</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPositions.map((position) => (
                  <TableRow key={position.code}>
                    <TableCell className="font-medium">{position.name}</TableCell>
                    <TableCell className="text-muted-foreground">{position.code}</TableCell>
                    <TableCell>{position.headcount}</TableCell>
                    <TableCell>{position.active}</TableCell>
                    <TableCell>
                      <Badge variant={position.status === '已满编' ? 'outline' : 'secondary'}>
                        {position.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </TabsContent>
        <TabsContent value="changes" className="mt-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>变更内容</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockChanges.map((change) => (
                  <TableRow key={`${change.date}-${change.content}`}>
                    <TableCell className="font-medium">{change.content}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{change.type}</Badge>
                    </TableCell>
                    <TableCell>{change.operator}</TableCell>
                    <TableCell className="text-muted-foreground">{change.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  )
}
