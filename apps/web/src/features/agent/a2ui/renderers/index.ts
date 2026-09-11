import { commonRenderers } from './common-renderers'
import { userRenderers } from './user-renderers'

export const renderers = {
  ...commonRenderers,
  ...userRenderers
}

export type Renderers = typeof renderers
