import { commonRenderers } from './common-renderers'

export const renderers = {
  ...commonRenderers
}

export type Renderers = typeof renderers
