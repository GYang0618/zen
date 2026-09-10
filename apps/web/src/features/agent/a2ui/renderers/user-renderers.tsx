import { A2UIUserTable } from '../components/a2ui-user-table'

import type { CatalogRenderers } from '@copilotkit/a2ui-renderer'
import type { Definitions } from '../definitions'

export const userRenderers: CatalogRenderers<Definitions> = {
  UserTable: A2UIUserTable
}
