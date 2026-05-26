import { LangGraphAgent } from './langgraph-runtime-agent'

const agents = {
  default: { url: 'http://localhost:3600', graphId: 'default_agent' },
  plan: { url: 'http://localhost:3600', graphId: 'plan_agent' }
} as const

import { ACCESS_TOKEN_CONFIGURABLE_KEY } from '@zen/shared'

export const defaultAgent = ({ accessToken }: { accessToken?: string }) =>
  new LangGraphAgent({
    deploymentUrl: agents.default.url,
    graphId: agents.default.graphId,
    assistantConfig: accessToken
      ? {
          configurable: {
            [ACCESS_TOKEN_CONFIGURABLE_KEY]: accessToken
          }
        }
      : undefined
  })

export const planAgent = () =>
  new LangGraphAgent({
    deploymentUrl: agents.plan.url,
    graphId: agents.plan.graphId
  })
