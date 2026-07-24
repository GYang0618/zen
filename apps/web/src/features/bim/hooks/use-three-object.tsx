import { getObjectId, getObjectKind, getObjectUserData, isObjectSelectable } from '../lib/object'

import type { Object3D } from 'three'
import type { KindType } from '../lib/object'

type ThreeObjectReturn<T extends Record<string, unknown> = Record<string, unknown>> = {
  id: string
  kind: KindType
  isSelectable: boolean
  userData: T
}

export function useThreeObject<UserData extends Record<string, unknown> = Record<string, unknown>>(
  object: Object3D
): ThreeObjectReturn<UserData> {
  const userData = getObjectUserData<UserData>(object)
  const id = getObjectId(object)
  const kind = getObjectKind(userData)
  const isSelectable = isObjectSelectable(object)

  return { id, kind, isSelectable, userData }
}
