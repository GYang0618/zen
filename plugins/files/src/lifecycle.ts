import { activate } from './activate'
import { deactivate } from './deactivate'

import type { PluginLifecycleHooks } from '@zen/plugin-sdk'

export const lifecycle: PluginLifecycleHooks = {
  onEnable: activate,
  onDisable: deactivate
}
