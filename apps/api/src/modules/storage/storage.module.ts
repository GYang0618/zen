import { Module } from '@nestjs/common'

import { OBJECT_STORAGE, S3CompatibleStorage } from '@/infra/storage'

import { MeAvatarController } from './me-avatar.controller'
import { StorageCleanupService } from './storage.cleanup'
import { StorageController } from './storage.controller'
import { StorageRepository } from './storage.repository'
import { StorageService } from './storage.service'

@Module({
  controllers: [StorageController, MeAvatarController],
  providers: [
    StorageService,
    StorageRepository,
    StorageCleanupService,
    { provide: OBJECT_STORAGE, useClass: S3CompatibleStorage }
  ],
  exports: [StorageService]
})
export class StorageModule {}
