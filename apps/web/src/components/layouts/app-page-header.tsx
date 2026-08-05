import { useMatches, useRouter } from '@tanstack/react-router'
import {
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle
} from '@zen/ui'
import { ArrowLeft } from 'lucide-react'

import type { ReactNode } from 'react'
import type { AppPath } from '@/types/router'

interface AppPageHeaderProps {
  /** 覆盖路由 `staticData.title`；未传时读取 `from` 或当前叶子路由 */
  title?: string
  size?: 'sm' | 'default' | 'lg'
  /** 覆盖路由 `staticData.description`；未传时读取 `from` 或当前叶子路由 */
  description?: string
  /**
   * 指定读取 `staticData` 的路由路径（`AppPath`，如 layout 的 fullPath）。
   * 未传时默认取当前叶子路由。
   */
  from?: AppPath
  media?: ReactNode
  back?: boolean
  actions?: ReactNode
}

export function AppPageHeader({
  title,
  description,
  size = 'default',
  from,
  back = false,
  actions
}: AppPageHeaderProps) {
  const router = useRouter()
  const matches = useMatches()
  const routeMeta = from
    ? matches.find((match) => match.fullPath === from || match.pathname === from)?.staticData
    : matches.at(-1)?.staticData

  const resolvedTitle = title ?? routeMeta?.title
  const resolvedDescription = description ?? routeMeta?.description

  return (
    <PageHeader size={size}>
      {back && (
        <Button
          variant="outline"
          className="rounded-full size-10"
          asChild
          onClick={() => router.history.back()}
        >
          <ArrowLeft />
        </Button>
      )}
      <PageHeaderContent>
        {resolvedTitle ? <PageHeaderTitle>{resolvedTitle}</PageHeaderTitle> : null}
        {resolvedDescription ? (
          <PageHeaderDescription>{resolvedDescription}</PageHeaderDescription>
        ) : null}
      </PageHeaderContent>
      {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
    </PageHeader>
  )
}
