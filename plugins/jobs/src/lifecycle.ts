import { activate } from './activate.js'
import { deactivate } from './deactivate.js'

import type { PluginLifecycleHooks } from '@zen/plugin-sdk'

export const lifecycle: PluginLifecycleHooks = {
  onEnable: activate,
  onDisable: deactivate
}
