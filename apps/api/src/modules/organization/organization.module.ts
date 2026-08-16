import { Module } from '@nestjs/common'

import { PostModule } from '@/modules/post'

import { OrganizationController } from './organization.controller'
import { OrganizationRepository } from './organization.repository'
import { OrganizationService } from './organization.service'

@Module({
  imports: [PostModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService, OrganizationRepository]
})
export class OrganizationModule {}
