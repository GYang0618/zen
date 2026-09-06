import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { authConfig, securityConfig } from '../config/index.js'
import { LoggerModule } from '../infra/logger/index.js'
import { PrismaModule } from '../infra/prisma/index.js'
import { TenantPluginStateService } from '../modules/plugin/tenant-plugin-state.service.js'
import { AgentIdempotencyService } from './auth/agent-idempotency.service.js'
import { AuditService } from './auth/audit.service.js'
import { AuthContextService } from './auth/auth-context.service.js'
import { MembershipService } from './auth/membership.service.js'
import { PermissionCatalogSyncService } from './auth/permission-catalog-sync.service.js'
import { SessionService } from './auth/session.service.js'
import { UserActivityService } from './auth/user-activity.service.js'
import { AllExceptionsFilter } from './filters/all-exceptions.filter.js'
import { AuthGuard } from './guards/auth.guard.js'
import { AuthContextGuard } from './guards/auth-context.guard.js'
import { PermissionGuard } from './guards/permission.guard.js'
import { PluginActiveGuard } from './guards/plugin-active.guard.js'
import { StepUpGuard } from './guards/step-up.guard.js'
import { AgentIdempotencyInterceptor } from './interceptors/agent-idempotency.interceptor.js'
import { TransformInterceptor } from './interceptors/transform.interceptor.js'

import type { AuthConfig, SecurityConfig } from '../config/index.js'

@Global()
@Module({
  imports: [
    LoggerModule,
    PrismaModule,
    ThrottlerModule.forRootAsync({
      imports: [],
      inject: [securityConfig.KEY],
      useFactory: (security: SecurityConfig) => [
        {
          name: 'default',
          ttl: security.throttle.ttl,
          limit: security.throttle.limit
        },
        {
          name: 'copilot',
          ttl: security.copilotThrottle.ttl,
          limit: security.copilotThrottle.limit
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
    AgentIdempotencyService,
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
    AgentIdempotencyService,
    AuditService,
    SessionService,
    UserActivityService,
    MembershipService,
    PermissionCatalogSyncService,
    TenantPluginStateService
  ]
})
export class CommonModule {}
