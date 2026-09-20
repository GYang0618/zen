import { zenA2uiCatalogDefinitions } from '@zen/shared'

import type { CatalogDefinitions } from '@copilotkit/a2ui-renderer'

export const commonCatalogDefinitions = zenA2uiCatalogDefinitions as unknown as CatalogDefinitions

export type CommonCatalogDefinitions = typeof zenA2uiCatalogDefinitions
