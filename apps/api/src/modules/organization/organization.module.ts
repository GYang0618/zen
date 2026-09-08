import { Module } from '@nestjs/common'

import { PostModule } from '../post/index.js'
import { OrganizationController } from './organization.controller.js'
import { OrganizationRepository } from './organization.repository.js'
import { OrganizationService } from './organization.service.js'

@Module({
  imports: [PostModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService, OrganizationRepository]
})
export class OrganizationModule {}
