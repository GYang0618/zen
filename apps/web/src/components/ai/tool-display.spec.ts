import { describe, expect, it } from 'vitest'

import {
  getToolReasoningPhrase,
  getToolTitle,
  hasDedicatedResultUi,
  sanitizeReasoningContent
} from './tool-display'

describe('getToolTitle', () => {
  it('返回已登记工具的中文标题', () => {
    expect(getToolTitle('create_user')).toBe('创建用户')
    expect(getToolTitle('create_job_profile')).toBe('创建岗位')
  })

  it('未登记工具回退为下划线转空格', () => {
    expect(getToolTitle('unknown_tool')).toBe('unknown tool')
  })
})

describe('hasDedicatedResultUi', () => {
  it('仅结果型工具保留对话内 UI', () => {
    expect(hasDedicatedResultUi('query_users_list')).toBe(true)
    expect(hasDedicatedResultUi('query_job_profiles_list')).toBe(true)
    expect(hasDedicatedResultUi('query_properties')).toBe(true)
    expect(hasDedicatedResultUi('indoor_walkthrough')).toBe(true)
  })

  it('设置外观、创建用户等不渲染工具调用折叠条', () => {
    expect(hasDedicatedResultUi('appearance')).toBe(false)
    expect(hasDedicatedResultUi('create_user')).toBe(false)
    expect(hasDedicatedResultUi('query_organization_tree')).toBe(false)
  })
})

describe('getToolReasoningPhrase', () => {
  it('查询类使用检索口径', () => {
    expect(getToolReasoningPhrase('query_organization_tree', 'pending')).toBe('正在检索组织架构')
    expect(getToolReasoningPhrase('query_organization_tree', 'done')).toBe('组织架构已就绪')
  })

  it('写操作使用办理口径', () => {
    expect(getToolReasoningPhrase('create_user', 'pending')).toBe('正在创建用户')
    expect(getToolReasoningPhrase('create_user', 'done')).toBe('创建用户已完成')
  })
})

describe('sanitizeReasoningContent', () => {
  it('把「需要调用工具」改写为业务检索用语', () => {
    expect(
      sanitizeReasoningContent('用户要求查询组织树，我需要调用 query_organization_tree 工具')
    ).toBe('用户要求查询组织树，正在检索组织架构')
  })

  it('把「已经调用工具」改写为完成态', () => {
    expect(sanitizeReasoningContent('我已经调用 query_organization_tree 工具')).toBe(
      '组织架构已就绪'
    )
  })

  it('不含调用口吻的文案保持原样', () => {
    expect(sanitizeReasoningContent('先检索当前组织树，核对部门层级与节点标识。')).toBe(
      '先检索当前组织树，核对部门层级与节点标识。'
    )
  })

  it('未登记的工具名不改写调用句式', () => {
    expect(sanitizeReasoningContent('需要调用 unknown_custom_tool 工具')).toBe(
      '需要调用 unknown_custom_tool 工具'
    )
  })

  it('裸露的工具函数名替换为中文标题', () => {
    expect(sanitizeReasoningContent('接下来用 query_roles_list 核对角色标识')).toBe(
      '接下来用 查询角色列表 核对角色标识'
    )
  })
})
