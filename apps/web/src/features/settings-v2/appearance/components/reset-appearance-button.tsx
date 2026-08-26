import { Button } from '@zen/ui'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { useResetAppearance } from '@/hooks'

export function ResetAppearanceButton() {
  const { isDefault, resetAppearance } = useResetAppearance()

  const handleReset = () => {
    if (isDefault) return
    resetAppearance()
    toast.success('已恢复系统默认外观')
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isDefault}
      onClick={handleReset}
      aria-label="将外观恢复为系统默认"
      title={isDefault ? '当前已是系统默认外观' : '将主题、颜色、字体、样式与布局恢复为系统默认'}
    >
      <RotateCcw data-icon="inline-start" />
      恢复默认
    </Button>
  )
}
