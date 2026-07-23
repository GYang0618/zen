import { Injectable, Logger } from '@nestjs/common'

import { DEMO_NOTE_CREATED_EVENT } from '../constants'

export type DemoNoteCreatedPayload = {
  noteId: string
  tenantId: string
  userId: string
}

/**
 * 最小领域事件总线：当前进程内同步派发，供参考插件演示。
 */
@Injectable()
export class DemoNotesEventBus {
  private readonly logger = new Logger(DemoNotesEventBus.name)
  private readonly listeners = new Map<string, Array<(payload: unknown) => void>>()

  on(event: string, listener: (payload: unknown) => void) {
    const list = this.listeners.get(event) ?? []
    list.push(listener)
    this.listeners.set(event, list)
    return () => {
      const next = (this.listeners.get(event) ?? []).filter((item) => item !== listener)
      this.listeners.set(event, next)
    }
  }

  emit(event: string, payload: unknown) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload)
    }
  }

  emitNoteCreated(payload: DemoNoteCreatedPayload) {
    this.emit(DEMO_NOTE_CREATED_EVENT, payload)
    this.logger.log({ event: DEMO_NOTE_CREATED_EVENT, ...payload })
  }
}
