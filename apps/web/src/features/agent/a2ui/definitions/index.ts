import { commonCatalogDefinitions } from './common-definitions'
import { userCatalogDefinitions } from './user-definitions'

export const definitions = {
  ...commonCatalogDefinitions,
  ...userCatalogDefinitions
}

export type Definitions = typeof definitions
