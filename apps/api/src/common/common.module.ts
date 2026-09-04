import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { authConfig, securityConfig } from '@/config'
import { LoggerModule } from '@/infra/logger'
import { PrismaModule } from '@/infra/prisma'
import { TenantPluginStateService } from '@/modules/plugin/tenant-plugin-state.service'

import { AuditService } from './auth/audit.service'
import { AuthContextService } from './auth/auth-context.service'
import { MembershipService } from './auth/membership.service'
import { PermissionCatalogSyncService } from './auth/permission-catalog-sync.service'
import { SessionService } from './auth/session.service'
import { UserActivityService } from './auth/user-activity.service'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { AuthGuard } from './guards/auth.guard'
import { AuthContextGuard } from './guards/auth-context.guard'
import { PermissionGuard } from './guards/permission.guard'
import { PluginActiveGuard } from './guards/plugin-active.guard'
import { StepUpGuard } from './guards/step-up.guard'
import { AgentIdempotencyInterceptor } from './interceptors/agent-idempotency.interceptor'
import { TransformInterceptor } from './interceptors/transform.interceptor'

import type { AuthConfig, SecurityConfig } from '@/config'

@Global()
@Module({
  imports: [
    LoggerModule,
    PrismaModule,
    ThrottlerModule.forRootAsync({
      inject: [securityConfig.KEY],
      useFactory: (security: SecurityConfig) => [
        {
          name: 'default',
          ttl: security.throttle.ttl,
          limit: security.throttle.limit
        }
      ]
    }),
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (cfg: AuthConfig) => ({
        secret: cfg.secret
      })
    })
  ],
  providers: [
    AuthContextService,
    AuditService,
    SessionService,
    UserActivityService,
    MembershipService,
    PermissionCatalogSyncService,
    TenantPluginStateService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: AuthContextGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    },
    {
      provide: APP_GUARD,
      useClass: PluginActiveGuard
    },
    {
      provide: APP_GUARD,
      useClass: StepUpGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AgentIdempotencyInterceptor
    }
  ],
  exports: [
    JwtModule,
    AuthContextService,
    AuditService,
    SessionService,
    UserActivityService,
    MembershipService,
    PermissionCatalogSyncService,
    TenantPluginStateService
  ]
})
export class CommonModule {}
