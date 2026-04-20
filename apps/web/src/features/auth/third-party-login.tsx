import { Button, Field } from '@zen/ui'

import { IconApple, IconGoogle, IconMeta } from '@/components/icons'

interface ThirdPartyLoginProps {
  disabled?: boolean
}

export function ThirdPartyLogin({ disabled = false }: ThirdPartyLoginProps) {
  return (
    <Field className="grid grid-cols-3 gap-4">
      <Button variant="outline" type="button" disabled={disabled}>
        <IconApple />
        <span className="sr-only">使用 Apple 登录</span>
      </Button>
      <Button variant="outline" type="button" disabled={disabled}>
        <IconGoogle />
        <span className="sr-only">使用 Google 登录</span>
      </Button>
      <Button variant="outline" type="button" disabled={disabled}>
        <IconMeta />
        <span className="sr-only">使用 Meta 登录</span>
      </Button>
    </Field>
  )
}
