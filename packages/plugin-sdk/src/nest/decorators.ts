import { SetMetadata } from '@nestjs/common'

import { REQUIRE_PERMISSIONS_KEY, REQUIRE_PLUGIN_ID_KEY } from '../constants.js'

export type RequirePermissionsMode = 'all' | 'any'

export type RequirePermissionsMeta = {
  codes: string[]
  mode: RequirePermissionsMode
}

/** 与平台 PermissionGuard 共用 metadata key */
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

/** 声明接口所属插件；停用后由平台 PluginActiveGuard 拦截 */
export function RequirePlugin(pluginId: string): ClassDecorator & MethodDecorator {
  return SetMetadata(REQUIRE_PLUGIN_ID_KEY, pluginId)
}
