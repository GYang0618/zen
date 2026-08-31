import { ACCESS_TOKEN_CONFIGURABLE_KEY } from '@zen/shared'

import { LangGraphAgent } from './langgraph-runtime-agent'

const agents = {
  default: { graphId: 'default_agent' },
  plan: { graphId: 'plan_agent' }
} as const

export const defaultAgent = ({
  deploymentUrl,
  accessToken
}: {
  deploymentUrl: string
  accessToken?: string
}) =>
  new LangGraphAgent({
    deploymentUrl,
    graphId: agents.default.graphId,
    assistantConfig: accessToken
      ? {
          configurable: {
            [ACCESS_TOKEN_CONFIGURABLE_KEY]: accessToken
          }
        }
      : undefined
  })

export const planAgent = ({ deploymentUrl }: { deploymentUrl: string }) =>
  new LangGraphAgent({
    deploymentUrl,
    graphId: agents.plan.graphId
  })
