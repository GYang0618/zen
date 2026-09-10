import { userRenderers } from './user-renderers'

import type { CatalogRenderers } from '@copilotkit/a2ui-renderer'
import type { Definitions } from '../definitions'

export const renderers: CatalogRenderers<Definitions> = {
  ...userRenderers
}
