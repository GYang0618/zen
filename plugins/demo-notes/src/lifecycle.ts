import type { PluginLifecycleHooks } from '@zen/plugin-sdk'

import { activate } from './activate'
import { deactivate } from './deactivate'

export const lifecycle: PluginLifecycleHooks = {
  onEnable: activate,
  onDisable: deactivate
}
