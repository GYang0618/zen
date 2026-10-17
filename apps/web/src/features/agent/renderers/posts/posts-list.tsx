import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useMemo } from 'react'

import { PostsCard, columns as postColumns } from '@/features/system/posts'

import { DataTable } from '../../a2ui/components/data-table'
import { AgentCardScroll } from '../../components/agent-card-scroll'
import { ViewSwitcher } from '../../generative-ui/components/view-switcher'
import { withListActions } from '../with-list-actions'
import { PostAgentMenu } from './post-menu'

import type { JobProfileListItem, PageMeta } from '@zen/shared'

interface PostsListViewProps {
  title: string
  data: JobProfileListItem[]
  description?: string
  pagination?: PageMeta
  loading?: boolean
}

export function PostsList({ title, description, data, loading = false }: PostsListViewProps) {
  const columns = useMemo(
    () => withListActions(postColumns, (item) => <PostAgentMenu item={item} />),
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
              暂无岗位数据
            </div>
          ) : (
            <AgentCardScroll
              key={data.map((post) => post.id).join(':')}
              items={data}
              renderItem={(post) => (
                <PostsCard item={post} actions={<PostAgentMenu item={post} />} />
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
            emptyMessage="暂无岗位数据"
          />
        )
      }
    ],
    [columns, data, loading]
  )

  return (
    <ViewSwitcher
      title={title ?? '岗位查询结果'}
      description={description}
      views={views}
      loading={loading}
    />
  )
}
