import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zen/ui'

export interface User {
  username: string
  nickname: string
  email: string
  phoneNumber: string
}

export function AITable({ data }: { data: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">用户名</TableHead>
          <TableHead>名称</TableHead>
          <TableHead>邮箱</TableHead>
          <TableHead className="text-right">手机号</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((d) => (
          <TableRow key={d.username}>
            <TableCell className="font-medium">{d.username}</TableCell>
            <TableCell>{d.nickname}</TableCell>
            <TableCell>{d.email}</TableCell>
            <TableCell className="text-right">{d.phoneNumber}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
