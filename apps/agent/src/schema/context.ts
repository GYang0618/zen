import {
  ACCESS_TOKEN_CONFIGURABLE_KEY,
  ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  AGENT_RUN_ID_CONFIGURABLE_KEY,
  AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY
} from '@zen/shared'
import { z } from 'zod'

export const ContextSchema = z.object({
  [ACCESS_TOKEN_CONFIGURABLE_KEY]: z.string().optional(),
  [AGENT_MEMORY_CONFIGURABLE_KEY]: z.string().optional(),
  [AGENT_RUN_ID_CONFIGURABLE_KEY]: z.string().optional(),
  [AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY]: z.string().optional(),
  [ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY]: z.array(z.string()).default([])
})
