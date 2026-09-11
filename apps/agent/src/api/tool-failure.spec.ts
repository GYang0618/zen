import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  classifyToolError,
  formatUnhandledToolError,
  isToolFailureResult,
  toToolFailureResult
} from './tool-failure'

import type { RecoverableHint } from './tool-failure'

const HINTS: RecoverableHint[] = [
  {
    match: '部分角色不存在或已禁用',
    reason: 'ROLE_ID_INVALID',
    hint: '请先 query_roles_list，使用返回的 id。'
  }
]

describe('toToolFailureResult', () => {
  it('匹配到业务 hint 时返回 API 错误信封与下一步指引', () => {
    const raw = toToolFailureResult(new Error('API 调用失败: 部分角色不存在或已禁用'), HINTS)
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 500)
    assert.equal(parsed.reason, 'ROLE_ID_INVALID')
    assert.match(parsed.message, /query_roles_list/)
  })

  it('未匹配 hint 时仍返回工具结果，而不是抛错', () => {
    const raw = toToolFailureResult(new Error('网络超时'), HINTS)
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 500)
    assert.equal(parsed.reason, 'UNKNOWN_ERROR')
    assert.match(parsed.message, /网络超时/)
    assert.match(parsed.message, /向用户询问/)
  })

  it('权限类错误禁止引导模型再次调用同一工具', () => {
    const raw = toToolFailureResult({ code: 403, message: '需要二次确认' })
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 403)
    assert.equal(parsed.reason, 'STEP_UP_REQUIRED')
    assert.match(parsed.message, /不要再次调用/)
    assert.doesNotMatch(parsed.message, /修正参数后重试/)
  })

  it('透传原生 API 错误体字段', () => {
    const raw = toToolFailureResult(
      {
        code: 400,
        reason: 'VALIDATION_ERROR',
        message: '部分角色不存在或已禁用',
        path: '/api/user',
        traceId: 'trace-api',
        timestamp: '2026-09-08T06:00:00.000Z',
        error: null,
        fieldErrors: { roleIds: ['无效'] },
        formErrors: null
      },
      HINTS
    )
    const parsed = JSON.parse(raw) as {
      code: number
      reason: string
      path: string
      traceId: string
      fieldErrors: Record<string, string[]>
      message: string
    }

    assert.equal(parsed.code, 400)
    assert.equal(parsed.reason, 'ROLE_ID_INVALID')
    assert.equal(parsed.path, '/api/user')
    assert.equal(parsed.traceId, 'trace-api')
    assert.deepEqual(parsed.fieldErrors, { roleIds: ['无效'] })
    assert.match(parsed.message, /query_roles_list/)
  })
})

describe('isToolFailureResult', () => {
  it('识别失败 JSON', () => {
    assert.equal(isToolFailureResult(toToolFailureResult(new Error('x'))), true)
    assert.equal(
      isToolFailureResult(
        JSON.stringify({
          code: 200,
          message: 'Success',
          data: { id: '1' },
          traceId: 't',
          timestamp: '2026-09-08T06:00:00.000Z'
        })
      ),
      false
    )
    assert.equal(isToolFailureResult(JSON.stringify({ id: '1' })), false)
    assert.equal(isToolFailureResult('not-json'), false)
  })
})

describe('formatUnhandledToolError', () => {
  it('带上工具名，便于模型纠正参数', () => {
    const raw = formatUnhandledToolError(new Error('组织 ID 不能为空'), 'create_organization')
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 500)
    assert.equal(parsed.reason, 'UNKNOWN_ERROR')
    assert.match(parsed.message, /create_organization/)
    assert.match(parsed.message, /组织 ID 不能为空/)
  })
})

describe('classifyToolError', () => {
  it('按 HTTP 状态和网络错误分类', () => {
    assert.equal(classifyToolError({ code: 404, message: '用户不存在' }), 'BUSINESS_ERROR')
    assert.equal(classifyToolError({ response: { status: 401 } }), 'UNAUTHORIZED')
    assert.equal(
      classifyToolError(new Error('缺少用户 access token，无法调用后端用户 API')),
      'UNAUTHORIZED'
    )
    assert.equal(classifyToolError({ response: { status: 403 } }), 'FORBIDDEN')
    assert.equal(classifyToolError({ code: 403, message: '需要二次确认' }), 'STEP_UP_REQUIRED')
    assert.equal(classifyToolError({ response: { status: 429 } }), 'RATE_LIMITED')
    assert.equal(
      classifyToolError({ code: 'ECONNRESET', message: 'socket closed' }),
      'NETWORK_ERROR'
    )
    assert.equal(classifyToolError({ code: 'ETIMEDOUT', message: 'timeout' }), 'TIMEOUT')
  })

  it('认证失败返回 401 错误信封', () => {
    const raw = toToolFailureResult(new Error('缺少用户 access token，无法调用后端用户 API'))
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 401)
    assert.equal(parsed.reason, 'UNAUTHORIZED')
    assert.match(parsed.message, /不要再次调用/)
  })
})
