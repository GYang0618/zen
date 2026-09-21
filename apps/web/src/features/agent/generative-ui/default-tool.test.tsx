// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@copilotkit/react-core/v2', () => ({
  useDefaultRenderTool: vi.fn(),
  useCopilotKit: vi.fn(() => ({ copilotkit: {} })),
  UseAgentUpdate: {
    OnMessagesChanged: 'onMessagesChanged',
    OnStateChanged: 'onStateChanged',
    OnRunStatusChanged: 'onRunStatusChanged'
  }
}))

import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { DefaultToolCard } from './default-tool'

describe('DefaultToolCard 状态与待审批联动', () => {
  beforeEach(() => {
    useAgentChatInputStore.getState().clearPendingApprovalTools()
    useAgentChatInputStore.getState().clearResolvingApprovalTools()
  })

  afterEach(() => {
    cleanup()
    useAgentChatInputStore.getState().clearPendingApprovalTools()
    useAgentChatInputStore.getState().clearResolvingApprovalTools()
  })

  it('普通工具执行中展示准备中状态', () => {
    render(
      <DefaultToolCard
        name="create_user"
        parameters={{ username: 'test' }}
        status="inProgress"
        result={undefined}
      />
    )

    expect(screen.getByLabelText('准备中')).toBeDefined()
    expect(screen.getByText('创建用户')).toBeDefined()
  })

  it('当工具处于 pendingApprovalTools 且未完成时，状态展示为等待确认', () => {
    useAgentChatInputStore.getState().setPendingApprovalTools([
      {
        name: 'delete_users',
        args: { ids: ['user-1'] }
      }
    ])

    render(
      <DefaultToolCard
        name="delete_users"
        parameters={{ ids: ['user-1'] }}
        status="inProgress"
        result={undefined}
      />
    )

    expect(screen.getByLabelText('等待确认')).toBeDefined()
    expect(screen.getByText('删除用户')).toBeDefined()
  })

  it('工具完成后展示已完成状态，标题不含结果摘要', () => {
    render(
      <DefaultToolCard
        name="delete_users"
        parameters={{ ids: ['user-1'] }}
        status="complete"
        result={JSON.stringify({ success: true })}
      />
    )

    expect(screen.getByLabelText('已完成')).toBeDefined()
    expect(screen.getByText('删除用户')).toBeDefined()
    expect(screen.queryByText('删除用户 · 执行成功')).toBeNull()
  })

  it('后端返回 500 服务异常信封时，展示失败状态与服务暂不可用原因', () => {
    render(
      <DefaultToolCard
        name="delete_job_profile"
        parameters={{ id: 'pos-1' }}
        status="complete"
        result={JSON.stringify({
          code: 500,
          reason: 'TOOL_UNAVAILABLE',
          message: '底层服务异常或网络不可用。请向用户说明原因。'
        })}
      />
    )

    expect(screen.getByLabelText('失败')).toBeDefined()
    expect(screen.getByText('删除岗位')).toBeDefined()
    expect(screen.queryByText(/删除岗位 · /)).toBeNull()
    expect(screen.getByText('底层服务异常或网络不可用')).toBeDefined()
    expect(screen.getByText('HTTP 500')).toBeDefined()
  })

  it('后端返回业务冲突错误时，展示具体业务原因与友好提示', () => {
    render(
      <DefaultToolCard
        name="delete_job_profile"
        parameters={{ id: 'pos-1' }}
        status="complete"
        result={JSON.stringify({
          code: 409,
          reason: 'JOB_PROFILE_IN_USE',
          message: '该岗位已关联组织编制，请先解除关联后再删除'
        })}
      />
    )

    expect(screen.getByLabelText('失败')).toBeDefined()
    expect(screen.getByText('删除岗位')).toBeDefined()
    expect(screen.queryByText(/删除岗位 · /)).toBeNull()
    expect(screen.getByText('该岗位已关联组织编制，请先解除关联后再删除')).toBeDefined()
    expect(screen.getByText('HTTP 409')).toBeDefined()
  })

  it('当智能体已终止运行且工具未完成时，展示失败状态与执行中断原因，不卡在准备中', () => {
    render(
      <DefaultToolCard
        name="delete_job_profile"
        parameters={{ id: 'pos-1' }}
        status="inProgress"
        result={undefined}
        isAgentRunning={false}
      />
    )

    expect(screen.getByLabelText('失败')).toBeDefined()
    expect(screen.getByText('删除岗位')).toBeDefined()
    expect(screen.queryByText('删除岗位 · 执行中断')).toBeNull()
    expect(screen.getByText(/智能体运行已结束，该工具未收到后端响应/)).toBeDefined()
  })

  it('当工具已点击审批并处于恢复执行中时，即使 agent.isRunning 暂为 false 也不应被误判为执行中断', () => {
    useAgentChatInputStore.getState().markApprovalToolsResolving(['delete_users'])

    render(
      <DefaultToolCard
        name="delete_users"
        parameters={{ ids: ['user-1'] }}
        status="inProgress"
        result={undefined}
        isAgentRunning={false}
      />
    )

    // 不应展示中断/失败错误
    expect(screen.queryByText('失败')).toBeNull()
    expect(screen.queryByText(/智能体运行已结束，该工具未收到后端响应/)).toBeNull()
    expect(screen.getByLabelText('执行中')).toBeDefined()
  })

  it('当工具虽然 status 仍为 inProgress 但 result 已携带有效返回结果时，能自愈展示已完成', () => {
    render(
      <DefaultToolCard
        name="delete_users"
        parameters={{ ids: ['user-1'] }}
        status="inProgress"
        result={JSON.stringify({ success: true })}
        isAgentRunning={false}
      />
    )

    expect(screen.queryByText('失败')).toBeNull()
    expect(screen.getByLabelText('已完成')).toBeDefined()
    expect(screen.getByText('删除用户')).toBeDefined()
    expect(screen.queryByText('删除用户 · 执行成功')).toBeNull()
  })
})
