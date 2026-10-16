import { createCatalog } from '@copilotkit/a2ui-renderer'

import { ZEN_A2UI_CATALOG_ID } from './a2ui.constants'
import { definitions } from './definitions'
import { renderers } from './renderers'

export const catalog = createCatalog(definitions as never, renderers as never, {
  catalogId: ZEN_A2UI_CATALOG_ID,
  includeBasicCatalog: true
})
