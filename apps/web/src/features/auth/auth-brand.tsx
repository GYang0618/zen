import { IconZen } from '@/components/icons'
import { APP_BRAND_NAME, APP_BRAND_TAGLINE } from '@/config/brand'

export function AuthBrand() {
  return (
    <div className=" flex items-center justify-center gap-2">
      <IconZen className="size-6" />
      <h1 className="text-xl font-bold">
        {APP_BRAND_NAME} {APP_BRAND_TAGLINE}
      </h1>
    </div>
  )
}
