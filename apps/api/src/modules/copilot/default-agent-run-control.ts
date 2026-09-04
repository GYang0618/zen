import { Injectable } from '@nestjs/common'

/** 单实例内正在流式执行的 Run 取消表；跨实例状态以 PostgreSQL Lease 为准。 */
@Injectable()
export class DefaultAgentRunControl {
  private readonly abortByRunId = new Map<string, () => void>()

  register(runId: string, abort: () => void) {
    this.abortByRunId.set(runId, abort)
  }

  unregister(runId: string, abort: () => void) {
    if (this.abortByRunId.get(runId) === abort) this.abortByRunId.delete(runId)
  }

  cancel(runId: string): boolean {
    const abort = this.abortByRunId.get(runId)
    if (!abort) return false
    this.abortByRunId.delete(runId)
    abort()
    return true
  }
}
