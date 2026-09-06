import { Module } from '@nestjs/common'

import { AuditModule } from '../audit/audit.module.js'
import { AuthModule } from '../auth/auth.module.js'
import { RoleModule } from '../role/role.module.js'
import { UserModule } from '../user/user.module.js'

/** 身份域：认证、用户、角色与审计。 */
@Module({
  imports: [AuthModule, UserModule, RoleModule, AuditModule]
})
export class IdentityModule {}
