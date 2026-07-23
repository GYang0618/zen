import { SetMetadata } from '@nestjs/common'
import { REQUIRE_PERMISSIONS_KEY } from '@zen/plugin-sdk'

export { REQUIRE_PERMISSIONS_KEY }

export type RequirePermissionsMode = 'all' | 'any'

export type RequirePermissionsMeta = {
  codes: string[]
  mode: RequirePermissionsMode
}

/**
 * 声明接口所需权限码。默认需要同时具备全部权限（mode=all）。
 */
export function RequirePermission(
  ...args: string[] | [RequirePermissionsMeta]
): MethodDecorator & ClassDecorator {
  const first = args[0]
  const meta: RequirePermissionsMeta =
    typeof first === 'object' && first !== null && 'codes' in first
      ? {
          codes: first.codes,
          mode: first.mode ?? 'all'
        }
      : {
          codes: args as string[],
          mode: 'all'
        }

  return SetMetadata(REQUIRE_PERMISSIONS_KEY, meta)
}
