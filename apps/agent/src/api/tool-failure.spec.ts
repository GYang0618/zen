import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatUnhandledToolError, isToolFailureResult, toToolFailureResult } from './tool-failure'

import type { RecoverableHint } from './tool-failure'

const HINTS: RecoverableHint[] = [
  {
    match: '部分角色不存在或已禁用',
    reason: 'ROLE_ID_INVALID',
    hint: '请先 query_roles_list，使用返回的 id。'
  }
]

describe('toToolFailureResult', () => {
  it('匹配到业务 hint 时返回 success:false 与下一步指引', () => {
    const raw = toToolFailureResult(new Error('API 调用失败: 部分角色不存在或已禁用'), HINTS)
    const parsed = JSON.parse(raw) as { success: boolean; reason: string; message: string }

    assert.equal(parsed.success, false)
    assert.equal(parsed.reason, 'ROLE_ID_INVALID')
    assert.match(parsed.message, /query_roles_list/)
  })

  it('未匹配 hint 时仍返回工具结果，而不是抛错', () => {
    const raw = toToolFailureResult(new Error('网络超时'), HINTS)
    const parsed = JSON.parse(raw) as { success: boolean; reason: string; message: string }

    assert.equal(parsed.success, false)
    assert.equal(parsed.reason, 'TOOL_CALL_FAILED')
    assert.match(parsed.message, /网络超时/)
    assert.match(parsed.message, /向用户询问/)
  })
})

describe('isToolFailureResult', () => {
  it('识别失败 JSON', () => {
    assert.equal(isToolFailureResult(toToolFailureResult(new Error('x'))), true)
    assert.equal(isToolFailureResult(JSON.stringify({ id: '1' })), false)
    assert.equal(isToolFailureResult('not-json'), false)
  })
})

describe('formatUnhandledToolError', () => {
  it('带上工具名，便于模型纠正参数', () => {
    const raw = formatUnhandledToolError(new Error('组织 ID 不能为空'), 'create_organization')
    const parsed = JSON.parse(raw) as { reason: string; message: string }

    assert.equal(parsed.reason, 'TOOL_ERROR')
    assert.match(parsed.message, /create_organization/)
    assert.match(parsed.message, /组织 ID 不能为空/)
  })
})
