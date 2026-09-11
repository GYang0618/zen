import { LangGraphAgent } from '@ag-ui/langgraph'
import {
  ACCESS_TOKEN_CONFIGURABLE_KEY,
  AGENT_LOCALE_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  AGENT_MODEL_METADATA_CONFIGURABLE_KEY,
  AGENT_PERMISSIONS_CONFIGURABLE_KEY,
  AGENT_TENANT_ID_CONFIGURABLE_KEY,
  AGENT_THREAD_ID_CONFIGURABLE_KEY,
  AGENT_USER_ID_CONFIGURABLE_KEY,
  DEFAULT_AGENT_GRAPH_ID,
  DEFAULT_AGENT_RUN_BUDGET,
  DEFAULT_AGENT_VERSIONS
} from '@zen/shared'

import type { AuthContext } from '@zen/shared'

const agents = {
  default: { graphId: DEFAULT_AGENT_GRAPH_ID },
  plan: { graphId: 'plan_agent' }
} as const

export const defaultAgent = ({
  deploymentUrl,
  accessToken,
  auth,
  locale = 'zh-CN',
  threadId,
  memory
}: {
  deploymentUrl: string
  accessToken?: string
  auth?: Pick<AuthContext, 'tenantId' | 'userId' | 'permissions'>
  locale?: string
  threadId?: string
  memory?: string
}) => {
  const configurable = {
    ...(accessToken ? { [ACCESS_TOKEN_CONFIGURABLE_KEY]: accessToken } : {}),
    ...(auth?.tenantId ? { [AGENT_TENANT_ID_CONFIGURABLE_KEY]: auth.tenantId } : {}),
    ...(auth?.userId ? { [AGENT_USER_ID_CONFIGURABLE_KEY]: auth.userId } : {}),
    ...(threadId ? { [AGENT_THREAD_ID_CONFIGURABLE_KEY]: threadId } : {}),
    [AGENT_LOCALE_CONFIGURABLE_KEY]: locale,
    [AGENT_PERMISSIONS_CONFIGURABLE_KEY]: auth?.permissions ?? [],
    [AGENT_MODEL_METADATA_CONFIGURABLE_KEY]: {
      provider: 'qwen',
      model: DEFAULT_AGENT_VERSIONS.model,
      promptVersion: DEFAULT_AGENT_VERSIONS.prompt,
      toolSchemaVersion: DEFAULT_AGENT_VERSIONS.toolSchema
    },
    ...(memory ? { [AGENT_MEMORY_CONFIGURABLE_KEY]: memory } : {})
  }

  return new LangGraphAgent({
    deploymentUrl,
    graphId: agents.default.graphId,
    ...(accessToken ? { propertyHeaders: { Authorization: `Bearer ${accessToken}` } } : {}),
    assistantConfig: {
      recursion_limit: DEFAULT_AGENT_RUN_BUDGET.recursionLimit,
      ...(Object.keys(configurable).length ? { configurable } : {})
    }
  })
}

export const planAgent = ({
  deploymentUrl,
  accessToken
}: {
  deploymentUrl: string
  accessToken?: string
}) =>
  new LangGraphAgent({
    deploymentUrl,
    graphId: agents.plan.graphId,
    ...(accessToken ? { propertyHeaders: { Authorization: `Bearer ${accessToken}` } } : {})
  })
