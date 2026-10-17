import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useMemo } from 'react'

import { RolesCard, columns as roleColumns } from '@/features/system/roles'

import { DataTable } from '../../a2ui/components/data-table'
import { AgentCardScroll } from '../../components/agent-card-scroll'
import { ViewSwitcher } from '../../generative-ui/components/view-switcher'
import { withListActions } from '../with-list-actions'
import { RoleAgentMenu } from './role-menu'

import type { PageMeta, RoleListItem } from '@zen/shared'

interface RolesListViewProps {
  title: string
  data: RoleListItem[]
  description?: string
  pagination?: PageMeta
  loading?: boolean
}

export function RolesList({ title, description, data, loading = false }: RolesListViewProps) {
  const columns = useMemo(
    () => withListActions(roleColumns, (role) => <RoleAgentMenu role={role} />),
    []
  )
  const views = useMemo(
    () => [
      {
        key: 'card',
        icon: LayoutGrid,
        render:
          data.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              暂无角色数据
            </div>
          ) : (
            <AgentCardScroll
              key={data.map((role) => role.id).join(':')}
              items={data}
              renderItem={(role) => (
                <RolesCard role={role} actions={<RoleAgentMenu role={role} />} />
              )}
            />
          )
      },
      {
        key: 'table',
        icon: TextAlignStart,
        render: (
          <DataTable
            data={data}
            columns={columns}
            isLoading={loading}
            emptyMessage="暂无角色数据"
          />
        )
      }
    ],
    [columns, data, loading]
  )

  return (
    <ViewSwitcher
      title={title ?? '角色查询结果'}
      description={description}
      views={views}
      loading={loading}
    />
  )
}
