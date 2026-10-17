'use client'

import { A2UIProvider } from '@copilotkit/a2ui-renderer'
import { Badge, Button, cn } from '@zen/ui'
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code,
  LayoutDashboard,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Terminal
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { A2UISurfaceHost } from '@/features/agent/a2ui/a2ui-surface-host'
import { catalog } from '@/features/agent/a2ui/catalog'
import { extractA2UISurfaces } from '@/features/agent/a2ui/use-a2ui-surfaces'
import { ChatCanvasBadge } from '@/features/agent/components/chat-canvas-badge'
import { useAgentCanvasStore } from '@/features/agent/stores/agent-canvas'

import { AGENT_SCENARIOS } from './agent-scenarios'

import type { AgentScenario } from './agent-scenarios'

export function AgentRuntimeSimulator() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('all-in-one')
  const [showJsonInspector, setShowJsonInspector] = useState(false)
  const [isSimulatedRunning, setIsSimulatedRunning] = useState(false)
  const isCanvasOpen = useAgentCanvasStore((state) => state.isOpen)
  const openSurface = useAgentCanvasStore((state) => state.openSurface)
  const setOpen = useAgentCanvasStore((state) => state.setOpen)

  const selectedScenario = useMemo<AgentScenario>(() => {
    return (
      AGENT_SCENARIOS.find((s) => s.id === selectedScenarioId) ??
      AGENT_SCENARIOS[0] ?? {
        id: 'fallback',
        name: 'Default',
        badgeLabel: 'Default',
        description: '',
        userPrompt: '',
        agentReply: '',
        toolCallId: 'call_fallback',
        payload: { surfaceId: 'fallback', title: 'Fallback', components: [] }
      }
    )
  }, [selectedScenarioId])

  // 构造标准的 CopilotKit / LangGraph Assistant 消息体
  const assistantMessage = useMemo(() => {
    return {
      id: `msg_assistant_${selectedScenario.id}`,
      role: 'assistant',
      content: selectedScenario.agentReply,
      toolCalls: [
        {
          id: selectedScenario.toolCallId,
          type: 'function',
          function: {
            name: 'render_a2ui',
            arguments: JSON.stringify(selectedScenario.payload)
          }
        }
      ]
    }
  }, [selectedScenario])

  // 通过正式的 extractA2UISurfaces 流水线解析 Surface
  const surfaces = useMemo(() => {
    return extractA2UISurfaces([assistantMessage], false)
  }, [assistantMessage])

  const activeSurface = surfaces[0]

  // 切换场景时默认展开画布并选中当前 surface
  useEffect(() => {
    if (activeSurface) {
      openSurface(activeSurface.surfaceId)
    }
  }, [activeSurface, openSurface])

  const handleSimulateEmit = () => {
    setIsSimulatedRunning(true)
    setTimeout(() => {
      setIsSimulatedRunning(false)
      if (activeSurface) {
        openSurface(activeSurface.surfaceId)
      }
    }, 400)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部场景快速切换胶囊栏 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Agent 真实工具调用测试场</h2>
              <p className="text-xs text-muted-foreground">
                验证 Agent 真实下发 render_a2ui 工具调用后，ChatCanvasBadge 与 A2UISurfaceHost
                的端到端解析与挂载
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <CheckCircle2 className="size-3 text-emerald-500" />
              A2UI v0.9 协议已就绪
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateEmit}
              disabled={isSimulatedRunning}
              className="gap-1.5"
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span>{isSimulatedRunning ? '生成中...' : '重新模拟调用'}</span>
            </Button>
          </div>
        </div>

        {/* 场景按钮列表 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {AGENT_SCENARIOS.map((sc) => {
            const isSelected = sc.id === selectedScenarioId
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenarioId(sc.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {sc.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 主工作区：左侧模拟对话流 + 右侧真实 A2UI 画布 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 min-h-160">
        {/* 左侧：智能体对话流 (Chat Message Thread) */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-primary" />
                <span className="text-xs font-semibold">智能体对话模拟 (Chat Stream)</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {selectedScenario.badgeLabel}
              </Badge>
            </div>

            {/* 用户提问气泡 */}
            <div className="mt-4 flex flex-col items-end">
              <div className="max-w-[88%] rounded-2xl rounded-tr-xs bg-primary px-3.5 py-2.5 text-xs text-primary-foreground shadow-xs">
                {selectedScenario.userPrompt}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">用户 · 刚刚</span>
            </div>

            {/* Agent 回复气泡 */}
            <div className="mt-4 flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-foreground">
                <div className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Bot className="size-2.5" />
                </div>
                <span>Zen Agent</span>
              </div>

              <div className="w-full rounded-2xl rounded-tl-xs border border-border bg-muted/40 p-3.5 text-xs text-foreground shadow-xs">
                <p className="leading-relaxed">{selectedScenario.agentReply}</p>

                {/* 核心：真实的 ChatCanvasBadge 组件 */}
                <div className="mt-3 pt-2.5 border-t border-border/50">
                  <div className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>生成式界面卡片入口：</span>
                    <span className="text-[10px] text-primary">点击卡片可展开/定位画布</span>
                  </div>
                  <ChatCanvasBadge toolCalls={assistantMessage.toolCalls as never} messages={[]} />
                </div>
              </div>
            </div>

            {/* Agent 工具调用参数检视器 */}
            <div className="mt-4 rounded-lg border border-border/80 bg-background/50 p-2.5">
              <button
                type="button"
                onClick={() => setShowJsonInspector((prev) => !prev)}
                className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <Code className="size-3.5 text-primary" />
                  <span>
                    render_a2ui 调用入参 ({selectedScenario.payload.components.length} 组件)
                  </span>
                </div>
                {showJsonInspector ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>

              {showJsonInspector && (
                <div className="mt-2.5">
                  <pre className="max-h-60 overflow-auto rounded-md bg-muted/70 p-2.5 text-[11px] leading-tight text-foreground font-mono">
                    {JSON.stringify(selectedScenario.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：真实的 A2UI 画布渲染宿主 (Chat Canvas Host) */}
        <div className="flex flex-col lg:col-span-8">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* 画布头部导航栏 */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <LayoutDashboard className="size-4" />
                </div>
                <span className="text-sm font-semibold truncate max-w-sm">
                  {activeSurface?.title || '画布'}
                </span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Surface ID: {activeSurface?.surfaceId}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  <CheckCircle2 className="size-3" />
                  A2UIRenderer Active
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(!isCanvasOpen)}
                  title={isCanvasOpen ? '收起画布' : '展开画布'}
                >
                  {isCanvasOpen ? (
                    <PanelRightClose className="size-4" />
                  ) : (
                    <PanelRightOpen className="size-4" />
                  )}
                  <span className="sr-only">切换画布</span>
                </Button>
              </div>
            </div>

            {/* 画布主体区：使用 A2UIProvider catalog 驱动 A2UISurfaceHost */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-muted/10">
              {activeSurface && isCanvasOpen ? (
                <A2UIProvider catalog={catalog}>
                  <div
                    key={activeSurface.surfaceId}
                    className="min-w-0 w-full animate-in fade-in duration-200"
                    data-testid="agent-a2ui-surface-container"
                  >
                    <A2UISurfaceHost surface={activeSurface} />
                  </div>
                </A2UIProvider>
              ) : (
                <div className="flex h-full min-h-80 flex-col items-center justify-center p-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <PanelRightOpen className="size-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">画布已折叠</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                    请在左侧对话流中点击「{selectedScenario.badgeLabel}
                    」生成式界面卡片，或点击右上角按钮展开画布。
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => setOpen(true)}
                  >
                    展开画布查看 UI
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
