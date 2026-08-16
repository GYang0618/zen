import { PermissionCode } from '@zen/shared'
import { Button } from '@zen/ui'
import { Plus } from 'lucide-react'

import { Can } from '@/components/auth/can'

import { usePosts } from '../posts-provider'

export function PostsPrimaryButtons() {
  const { setOpen, setCurrentRow } = usePosts()

  return (
    <Can permission={PermissionCode.POST_MANAGE}>
      <Button
        type="button"
        onClick={() => {
          setCurrentRow(null)
          setOpen('create')
        }}
      >
        <Plus />
        新建岗位
      </Button>
    </Can>
  )
}
