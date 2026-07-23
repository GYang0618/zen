import { Inject, Injectable, OnModuleInit } from '@nestjs/common'

import { DEMO_NOTE_CREATED_EVENT } from '../constants'
import { DemoNotesEventBus } from './event-bus'

import type { DemoNoteCreatedPayload } from './event-bus'

@Injectable()
export class DemoNoteCreatedListener implements OnModuleInit {
  constructor(@Inject(DemoNotesEventBus) private readonly eventBus: DemoNotesEventBus) {}

  onModuleInit() {
    this.eventBus.on(DEMO_NOTE_CREATED_EVENT, (payload) => {
      const data = payload as DemoNoteCreatedPayload
      // 参考实现：后续可挂接通知 / 审计扩展
      void data
    })
  }
}
