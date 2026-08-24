import { PermissionCode } from '@zen/shared'
import { Button } from '@zen/ui'
import { Upload } from 'lucide-react'

import { Can } from '@/components/auth/can'

import { useFiles } from '../files-provider'

export function FilesPrimaryButtons() {
  const { setOpen, setCurrentRow } = useFiles()
  return (
    <Can permission={PermissionCode.FILE_UPLOAD}>
      <Button
        type="button"
        onClick={() => {
          setCurrentRow(null)
          setOpen('upload')
        }}
      >
        <Upload data-icon="inline-start" />
        上传文件
      </Button>
    </Can>
  )
}
