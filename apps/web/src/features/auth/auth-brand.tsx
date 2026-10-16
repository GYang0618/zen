import { IconZen } from '@/components/icons'
import { APP_NAME } from '@/config/brand'

export function AuthBrand() {
  return (
    <div className=" flex items-center justify-center gap-2">
      <IconZen className="size-6" />
      <h1 className="text-primary text-xl font-bold">{APP_NAME}</h1>
    </div>
  )
}
