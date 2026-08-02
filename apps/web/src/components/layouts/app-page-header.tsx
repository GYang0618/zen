import { useRouter } from '@tanstack/react-router'
import {
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle
} from '@zen/ui'
import { ArrowLeft } from 'lucide-react'

import type { ReactNode } from 'react'

interface AppPageHeaderProps {
  title: string
  description?: string
  media?: ReactNode
  back?: boolean
  actions?: ReactNode
}

export function AppPageHeader({
  title,
  description,
  media,
  back = false,
  actions
}: AppPageHeaderProps) {
  const router = useRouter()
  return (
    <PageHeader>
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
      {media && <PageHeaderMedia>{media}</PageHeaderMedia>}
      <PageHeaderContent>
        <PageHeaderTitle>{title}</PageHeaderTitle>
        {description ? <PageHeaderDescription>{description}</PageHeaderDescription> : null}
      </PageHeaderContent>
      {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
    </PageHeader>
  )
}
