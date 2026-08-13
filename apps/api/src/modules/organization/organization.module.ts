import { Module } from '@nestjs/common'

import { RoleModule } from '@/modules/role/role.module'

import { OrganizationController } from './organization.controller'
import { OrganizationRepository } from './organization.repository'
import { OrganizationService } from './organization.service'

@Module({
  imports: [RoleModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService, OrganizationRepository]
})
export class OrganizationModule {}
