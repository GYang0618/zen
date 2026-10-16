import { getCurrentRequestContext } from './request-context'
import { isApiSuccessEnvelope, isRecord } from './tool-result'

/** 与 API CORS / Guard 约定一致的 Agent 请求头 */
export const AGENT_HTTP_HEADERS = {
  idempotencyKey: 'x-agent-idempotency-key',
  runId: 'x-agent-run-id',
  toolName: 'x-agent-tool-name',
  approvalId: 'x-agent-approval-id'
} as const

function setOptionalHeader(headers: Headers, name: string, value: string | undefined): void {
  if (value) headers.set(name, value)
}

/**
 * 请求拦截：对齐 web `withTokenMiddleware`，注入 Authorization、幂等键与 run/tool 标识。
 */
export function withAgentContextMiddleware(request: Request): Request {
  const context = getCurrentRequestContext()
  const headers = new Headers(request.headers)
  if (context?.accessToken) {
    headers.set('Authorization', `Bearer ${context.accessToken}`)
  }
  setOptionalHeader(headers, AGENT_HTTP_HEADERS.idempotencyKey, context?.idempotencyKey)
  setOptionalHeader(headers, AGENT_HTTP_HEADERS.runId, context?.runId)
  setOptionalHeader(headers, AGENT_HTTP_HEADERS.toolName, context?.toolName)
  setOptionalHeader(headers, AGENT_HTTP_HEADERS.approvalId, context?.approvalId)
  return new Request(request, { headers, signal: context?.signal ?? request.signal })
}

/**
 * 响应拦截：对齐 web `dataTransformMiddleware`，将 Nest 信封解包为业务 data。
 */
export async function unwrapEnvelopeMiddleware(response: Response): Promise<Response> {
  if (!response.ok) return response

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response

  let body: unknown
  try {
    body = await response.clone().json()
  } catch {
    return response
  }

  if (!isApiSuccessEnvelope(body)) return response

  return new Response(JSON.stringify(body.data), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}

/**
 * 错误拦截：对齐 web `globalErrorMiddleware`，补齐 HTTP status 供后续分类。
 */
export function normalizeErrorMiddleware(error: unknown, response: Response | undefined): unknown {
  if (!response) return error

  if (isRecord(error)) {
    if (typeof error.status === 'number' || typeof error.code === 'number') return error
    return { ...error, status: response.status }
  }

  if (typeof error === 'string') {
    return { status: response.status, message: error }
  }

  return error
}
