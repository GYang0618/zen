import {
  ACCESS_TOKEN_CONFIGURABLE_KEY,
  ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY,
  AGENT_APPROVAL_ID_CONFIGURABLE_KEY,
  AGENT_LOCALE_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  AGENT_MODEL_METADATA_CONFIGURABLE_KEY,
  AGENT_PERMISSIONS_CONFIGURABLE_KEY,
  AGENT_RUN_ID_CONFIGURABLE_KEY,
  AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY,
  AGENT_TENANT_ID_CONFIGURABLE_KEY,
  AGENT_THREAD_ID_CONFIGURABLE_KEY,
  AGENT_TOOL_NAME_CONFIGURABLE_KEY,
  AGENT_TRACE_ID_CONFIGURABLE_KEY,
  AGENT_USER_ID_CONFIGURABLE_KEY,
  DEFAULT_AGENT_GRAPH_ID,
  DEFAULT_AGENT_RUN_BUDGET,
  DEFAULT_AGENT_VERSIONS
} from '@zen/shared'

import { LangGraphAgent } from './langgraph-runtime-agent.js'

import type { AuthContext } from '@zen/shared'
import type { DefaultAgentRunControl } from './default-agent-run-control.js'
import type { DefaultAgentRuntimeHooks } from './default-agent-runtime.types.js'

const agents = {
  default: { graphId: DEFAULT_AGENT_GRAPH_ID },
  plan: { graphId: 'plan_agent' }
} as const

export const defaultAgent = ({
  deploymentUrl,
  accessToken,
  auth,
  locale = 'zh-CN',
  traceId,
  threadId,
  activePluginIds,
  memory,
  runId,
  stepUpToken,
  approvalId,
  toolName,
  runControl,
  runtimeHooks
}: {
  deploymentUrl: string
  accessToken?: string
  auth?: Pick<AuthContext, 'tenantId' | 'userId' | 'permissions'>
  locale?: string
  traceId?: string
  threadId?: string
  activePluginIds?: string[]
  memory?: string
  runId?: string
  stepUpToken?: string
  approvalId?: string
  toolName?: string
  runControl?: DefaultAgentRunControl
  runtimeHooks?: DefaultAgentRuntimeHooks
}) => {
  const configurable = {
    ...(accessToken ? { [ACCESS_TOKEN_CONFIGURABLE_KEY]: accessToken } : {}),
    ...(auth?.tenantId ? { [AGENT_TENANT_ID_CONFIGURABLE_KEY]: auth.tenantId } : {}),
    ...(auth?.userId ? { [AGENT_USER_ID_CONFIGURABLE_KEY]: auth.userId } : {}),
    ...(threadId ? { [AGENT_THREAD_ID_CONFIGURABLE_KEY]: threadId } : {}),
    ...(runId ? { [AGENT_RUN_ID_CONFIGURABLE_KEY]: runId } : {}),
    ...(traceId ? { [AGENT_TRACE_ID_CONFIGURABLE_KEY]: traceId } : {}),
    [AGENT_LOCALE_CONFIGURABLE_KEY]: locale,
    [AGENT_PERMISSIONS_CONFIGURABLE_KEY]: auth?.permissions ?? [],
    [AGENT_MODEL_METADATA_CONFIGURABLE_KEY]: {
      provider: 'qwen',
      model: DEFAULT_AGENT_VERSIONS.model,
      promptVersion: DEFAULT_AGENT_VERSIONS.prompt,
      toolSchemaVersion: DEFAULT_AGENT_VERSIONS.toolSchema
    },
    ...(activePluginIds ? { [ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY]: activePluginIds } : {}),
    ...(memory ? { [AGENT_MEMORY_CONFIGURABLE_KEY]: memory } : {}),
    ...(stepUpToken ? { [AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY]: stepUpToken } : {}),
    ...(approvalId ? { [AGENT_APPROVAL_ID_CONFIGURABLE_KEY]: approvalId } : {}),
    ...(toolName ? { [AGENT_TOOL_NAME_CONFIGURABLE_KEY]: toolName } : {})
  }

  return new LangGraphAgent({
    deploymentUrl,
    graphId: agents.default.graphId,
    assistantConfig: {
      recursion_limit: DEFAULT_AGENT_RUN_BUDGET.recursionLimit,
      ...(Object.keys(configurable).length ? { configurable } : {})
    }
  })
    .setRuntimeHooks(runtimeHooks ?? createNoopRuntimeHooks())
    .setRunControl(runControl ?? createNoopRunControl())
}

export const planAgent = ({ deploymentUrl }: { deploymentUrl: string }) =>
  new LangGraphAgent({
    deploymentUrl,
    graphId: agents.plan.graphId
  })

function createNoopRuntimeHooks(): DefaultAgentRuntimeHooks {
  return {
    onStart: async () => undefined,
    onError: async () => undefined,
    onEvent: async () => undefined,
    onComplete: async () => undefined
  }
}

function createNoopRunControl(): Pick<DefaultAgentRunControl, 'register' | 'unregister'> {
  return { register: () => undefined, unregister: () => undefined }
}
