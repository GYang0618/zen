import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  classifyToolError,
  formatApiError,
  formatUnhandledToolError,
  isToolFailureResult,
  toToolFailureResult
} from './tool-failure'

describe('toToolFailureResult', () => {
  it('透传 API 错误 message，不附加硬编码业务 hint', () => {
    const raw = toToolFailureResult({
      code: 400,
      reason: 'VALIDATION_ERROR',
      message: '部分角色不存在或已禁用，请使用有效且已启用的角色 ID',
      path: '/api/user',
      traceId: 'trace-api',
      timestamp: '2026-09-08T06:00:00.000Z',
      error: null,
      fieldErrors: { roleIds: ['无效'] },
      formErrors: null
    })
    const parsed = JSON.parse(raw) as {
      code: number
      reason: string
      path: string
      traceId: string
      fieldErrors: Record<string, string[]>
      message: string
    }

    assert.equal(parsed.code, 400)
    assert.equal(parsed.reason, 'VALIDATION_ERROR')
    assert.equal(parsed.path, '/api/user')
    assert.equal(parsed.traceId, 'trace-api')
    assert.deepEqual(parsed.fieldErrors, { roleIds: ['无效'] })
    assert.equal(parsed.message, '部分角色不存在或已禁用，请使用有效且已启用的角色 ID')
  })

  it('网络类错误保留原始 message，并归类为 TIMEOUT', () => {
    const raw = toToolFailureResult(new Error('网络超时'))
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 500)
    assert.equal(parsed.reason, 'TIMEOUT')
    assert.equal(parsed.message, '网络超时')
  })

  it('未知异常保留原始 message', () => {
    const raw = toToolFailureResult(new Error('参数格式不合法'))
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 500)
    assert.equal(parsed.reason, 'UNKNOWN_ERROR')
    assert.equal(parsed.message, '参数格式不合法')
  })

  it('403 归类为 FORBIDDEN 并透传 API message', () => {
    const raw = toToolFailureResult({ code: 403, message: '权限不足' })
    const parsed = JSON.parse(raw) as { code: number; reason: string; message: string }

    assert.equal(parsed.code, 403)
    assert.equal(parsed.reason, 'FORBIDDEN')
    assert.equal(parsed.message, '权限不足')
  })
})

describe('formatApiError', () => {
  it('合并 message 数组', () => {
    assert.equal(
      formatApiError({
        message: ['邮箱格式不正确', '用户名过短']
      }),
      '邮箱格式不正确；用户名过短'
    )
  })

  it('通用校验失败时附带 fieldErrors 明细', () => {
    assert.equal(
      formatApiError({
        message: '参数验证失败',
        fieldErrors: { email: ['必须是邮箱'] }
      }),
      '参数验证失败（email: 必须是邮箱）'
    )
  })

  it('兼容 messages 字段', () => {
    assert.equal(formatApiError({ messages: ['组织不存在'] }), '组织不存在')
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
    assert.equal(classifyToolError({ code: 403, message: '权限不足' }), 'FORBIDDEN')
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
    assert.match(parsed.message, /缺少用户 access token/)
  })
})
