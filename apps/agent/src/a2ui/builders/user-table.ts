import { ZEN_A2UI_CATALOG_ID } from '../constants'
import { createSurface, updateComponents, updateDataModel } from '../operations'

import type { User } from '@zen/shared'
import type { A2UIOperation } from '../operations'

export interface BuildUserTableSurfaceParams {
  surfaceId: string
  users: User[]
  title?: string
  stateKey?: string
  isLoading?: boolean
  catalogId?: string
}

/**
 * 组装用户表格 (UserTable) 的 A2UI Surface 操作集
 */
export function buildUserTableSurface({
  surfaceId,
  users,
  title = '用户列表',
  stateKey = 'users',
  isLoading = false,
  catalogId = ZEN_A2UI_CATALOG_ID
}: BuildUserTableSurfaceParams): A2UIOperation[] {
  const componentProps = {
    title,
    stateKey,
    users,
    isLoading
  }

  return [
    createSurface(surfaceId, catalogId),
    updateComponents(surfaceId, [
      {
        id: 'root',
        component: 'UserTable',
        ...componentProps,
        props: componentProps
      }
    ]),
    updateDataModel(surfaceId, {
      title,
      users,
      [stateKey]: users
    })
  ]
}
