import { configs } from '@/config/env'
import { useAuthStore as authStore } from '@/stores'

interface GenerateTitleResponse {
  threadId: string
  name: string
}

/**
 * 首条消息发出后主动请求后端精炼标题并写回（等价一次改标题）。
 */
export async function generateThreadTitle(
  threadId: string,
  content: string,
  agentId = 'default'
): Promise<string | null> {
  const accessToken = authStore.getState().accessToken
  if (!accessToken) return null

  const response = await fetch(
    `${configs.copilotKitApi}/threads/${encodeURIComponent(threadId)}/generate-title`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, agentId })
    }
  )

  if (!response.ok) {
    throw new Error(`generate-title failed: ${response.status}`)
  }

  const raw: unknown = await response.json()
  const body = unwrapGenerateTitleResponse(raw)
  return body.name?.trim() ? body.name : null
}

function unwrapGenerateTitleResponse(raw: unknown): GenerateTitleResponse {
  if (!raw || typeof raw !== 'object') {
    return { threadId: '', name: '' }
  }
  if ('data' in raw && raw.data && typeof raw.data === 'object') {
    return raw.data as GenerateTitleResponse
  }
  return raw as GenerateTitleResponse
}
