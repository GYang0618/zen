import {
  ACCESS_TOKEN_CONFIGURABLE_KEY,
  ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  AGENT_RUN_ID_CONFIGURABLE_KEY,
  AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY,
  DEFAULT_AGENT_GRAPH_ID,
  DEFAULT_AGENT_RUN_BUDGET
} from '@zen/shared'

import { LangGraphAgent } from './langgraph-runtime-agent'

import type { DefaultAgentRunControl } from './default-agent-run-control'
import type { DefaultAgentRuntimeHooks } from './default-agent-runtime.types'

const agents = {
  default: { graphId: DEFAULT_AGENT_GRAPH_ID },
  plan: { graphId: 'plan_agent' }
} as const

export const defaultAgent = ({
  deploymentUrl,
  accessToken,
  activePluginIds,
  memory,
  runId,
  stepUpToken,
  runControl,
  runtimeHooks
}: {
  deploymentUrl: string
  accessToken?: string
  activePluginIds?: string[]
  memory?: string
  runId?: string
  stepUpToken?: string
  runControl?: DefaultAgentRunControl
  runtimeHooks?: DefaultAgentRuntimeHooks
}) =>
  new LangGraphAgent({
    deploymentUrl,
    graphId: agents.default.graphId,
    assistantConfig: {
      recursion_limit: DEFAULT_AGENT_RUN_BUDGET.recursionLimit,
      ...(accessToken || memory || activePluginIds || runId || stepUpToken
        ? {
            configurable: {
              ...(accessToken ? { [ACCESS_TOKEN_CONFIGURABLE_KEY]: accessToken } : {}),
              ...(activePluginIds
                ? { [ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY]: activePluginIds }
                : {}),
              ...(memory ? { [AGENT_MEMORY_CONFIGURABLE_KEY]: memory } : {}),
              ...(runId ? { [AGENT_RUN_ID_CONFIGURABLE_KEY]: runId } : {}),
              ...(stepUpToken ? { [AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY]: stepUpToken } : {})
            }
          }
        : {})
    }
  })
    .setRuntimeHooks(runtimeHooks ?? createNoopRuntimeHooks())
    .setRunControl(runControl ?? createNoopRunControl())

export const planAgent = ({ deploymentUrl }: { deploymentUrl: string }) =>
  new LangGraphAgent({
    deploymentUrl,
    graphId: agents.plan.graphId
  })

function createNoopRuntimeHooks(): DefaultAgentRuntimeHooks {
  return {
    onStart: async () => undefined,
    onEvent: async () => undefined,
    onError: async () => undefined,
    onComplete: async () => undefined
  }
}

function createNoopRunControl(): Pick<DefaultAgentRunControl, 'register' | 'unregister'> {
  return { register: () => undefined, unregister: () => undefined }
}
