import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createRoleSchema, updateRoleSchema } from '../dist/index.js'

test('createRoleSchema defaults dataScope to self when omitted', () => {
  const parsed = createRoleSchema.parse({ name: '访客', code: 'guest_copy' })
  assert.equal(parsed.dataScope, 'self')
})

test('updateRoleSchema does not inject dataScope when omitted', () => {
  const parsed = updateRoleSchema.parse({ name: '普通用户', description: '基础使用权限' })
  assert.equal(parsed.name, '普通用户')
  assert.equal('dataScope' in parsed, false)
  assert.equal(parsed.dataScope, undefined)
})

test('updateRoleSchema still accepts an explicit dataScope', () => {
  const parsed = updateRoleSchema.parse({ dataScope: 'all' })
  assert.equal(parsed.dataScope, 'all')
})
