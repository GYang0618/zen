import { Inject, Injectable, Logger } from '@nestjs/common'

import { StorageService } from './storage.service'

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'

const SWEEP_INTERVAL_MS = 60_000

@Injectable()
export class StorageCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageCleanupService.name)
  private timer: ReturnType<typeof setInterval> | undefined

  constructor(@Inject(StorageService) private readonly storageService: StorageService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.storageService.sweepExpired().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`过期文件清理失败: ${message}`)
      })
    }, SWEEP_INTERVAL_MS)
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }
}
