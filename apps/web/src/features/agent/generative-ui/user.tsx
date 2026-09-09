import { AITable } from '@/components/ai'
import { columns } from '@/features/system/users'

import type { User } from '@zen/shared'

export const userTableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

export interface UserTableComponentProps {
  data?: User[]
  isLoading?: boolean
}

export function UserTableComponent({ data = [], isLoading = false }: UserTableComponentProps) {
  return (
    <AITable data={data} columns={userTableColumns} isLoading={isLoading} skeletonRowCount={3} />
  )
}
