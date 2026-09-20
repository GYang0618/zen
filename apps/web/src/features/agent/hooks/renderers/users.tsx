import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersPageSchema, usersQueryToolSchema } from '@zen/shared'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@zen/ui'
import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useMemo } from 'react'

import { columns, UserCard, UsersDialogs, UsersProvider } from '@/features/system/users'

import { DataTable } from '../../generative-ui'
import { ViewSwitcher } from '../../generative-ui/components/view-switcher'
import { parseToolResult } from '../../lib/parse-tool-result'

import type { PageMeta, UserListItem } from '@zen/shared'

export function useUsersRenderers() {
  useRenderTool({
    name: 'query_users_list',
    parameters: usersQueryToolSchema,
    render: ({ parameters, status, result }) => {
      try {
        if (status === 'inProgress') return <span>处理中...</span>
        const { title, description, display } = parameters.meta
        if (display === false) return null
        if (status === 'executing') return <span>工具执行中...</span>
        if (status === 'complete') {
          const data = parseToolResult(result, usersPageSchema)
          return (
            <UsersRender
              title={title}
              description={description}
              data={data?.items ?? []}
              pagination={data?.pagination}
            />
          )
        }
        return null
      } catch (error) {
        console.error(error)
        return null
      }
    }
  })
}

interface UsersRenderViewProps {
  title: string
  data: UserListItem[]
  description?: string
  pagination?: PageMeta
  loading?: boolean
}
function UsersRender({ title, description, data, loading = false }: UsersRenderViewProps) {
  const views = useMemo(
    () => [
      {
        key: 'card',
        icon: LayoutGrid,
        render:
          data.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              暂无用户数据
            </div>
          ) : (
            <Carousel className="w-full">
              <CarouselContent className="-ml-2">
                {data.map((user) => (
                  <CarouselItem key={user.id} className="pl-2 basis-full sm:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <UserCard user={user} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {data.length > 1 && (
                <>
                  <CarouselPrevious className="left-1" />
                  <CarouselNext className="right-1" />
                </>
              )}
            </Carousel>
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
            emptyMessage="暂无用户数据"
          />
        )
      }
    ],
    [data, loading]
  )

  return (
    <UsersProvider>
      <UsersDialogs />
      <ViewSwitcher
        title={title ?? '用户查询结果'}
        description={description}
        views={views}
        loading={loading}
      />
    </UsersProvider>
  )
}
