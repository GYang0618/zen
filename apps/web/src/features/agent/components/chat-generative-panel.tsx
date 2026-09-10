'use client'

import { A2UIProvider } from '@copilotkit/a2ui-renderer'
import { UseAgentUpdate, useAgent } from '@copilotkit/react-core/v2'
import { Badge, Button } from '@zen/ui'
import { CheckCircle2, Loader2, PanelRightClose, Sparkles } from 'lucide-react'

import { A2UISurfaceHost } from '../a2ui/a2ui-surface-host'
import { catalog } from '../a2ui/catalog'
import { useA2UISurfaces } from '../a2ui/use-a2ui-surfaces'
import { useLiveAgentMessages } from '../hooks/use-live-agent-messages'
import { useAgentGenerativePanelStore } from '../stores/agent-generative-panel'

export function ChatGenerativePanel() {
  const { agent } = useAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const { messages, isRunning } = useLiveAgentMessages(agent)
  const close = useAgentGenerativePanelStore((state) => state.close)

  const { surfaces, activeSurface, setActiveSurfaceId } = useA2UISurfaces(messages, isRunning)

  return (
    <A2UIProvider catalog={catalog}>
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        {/* 头部工具栏 */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <span className="truncate text-sm font-semibold">生成式工作区</span>
            {activeSurface && (
              <Badge variant="outline" className="text-xs font-normal">
                {activeSurface.title}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeSurface && (
              <Badge
                variant={activeSurface.isExecuting ? 'secondary' : 'outline'}
                className="gap-1 text-xs font-normal"
              >
                {activeSurface.isExecuting ? (
                  <>
                    <Loader2 className="size-3 animate-spin text-primary" />
                    执行中
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    已就绪
                  </>
                )}
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={close}
              title="收起工作区"
            >
              <PanelRightClose className="size-4" />
              <span className="sr-only">收起工作区</span>
            </Button>
          </div>
        </div>

        {/* 多 Surface 切换标签栏 */}
        {surfaces.length > 1 && (
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-muted/30 px-4 py-1.5 scrollbar-none">
            <span className="shrink-0 text-xs text-muted-foreground">历史界面：</span>
            {surfaces.map((s, idx) => {
              const isCurrent = activeSurface?.surfaceId === s.surfaceId
              return (
                <button
                  key={s.surfaceId}
                  type="button"
                  onClick={() => setActiveSurfaceId(s.surfaceId)}
                  className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${
                    isCurrent
                      ? 'bg-background text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  #{idx + 1} {s.title}
                </button>
              )
            })}
          </div>
        )}

        {/* 主体渲染区：纯声明式 A2UI 宿主 */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {activeSurface ? (
            <div key={activeSurface.surfaceId} className="min-w-0">
              <A2UISurfaceHost surface={activeSurface} />
            </div>
          ) : (
            <div className="flex h-full min-h-75 flex-col items-center justify-center p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Sparkles className="size-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">暂无生成式内容</h3>
              <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
                当智能体执行生成式工具（如查询用户列表等）时，将通过 A2UI
                协议在此处实时呈现交互界面和结构化结果。
              </p>
            </div>
          )}
        </div>
      </div>
    </A2UIProvider>
  )
}
