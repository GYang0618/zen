import { Module } from '@nestjs/common'

import { OBJECT_STORAGE, S3CompatibleStorage } from '../../infra/storage/index.js'
import { MeAvatarController } from './me-avatar.controller.js'
import { StorageCleanupService } from './storage.cleanup.js'
import { StorageController } from './storage.controller.js'
import { StorageRepository } from './storage.repository.js'
import { StorageService } from './storage.service.js'

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
