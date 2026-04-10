import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'

import { type AuthConfig, authConfig } from '@/config'
import { LoggerModule } from '@/infra/logger'

import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { AuthGuard } from './guards/auth.guard'
import { TransformInterceptor } from './interceptors/transform.interceptor'

@Global()
@Module({
  imports: [
    LoggerModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (cfg: AuthConfig) => ({
        secret: cfg.secret
      })
    })
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor
    }
  ],
  exports: [JwtModule]
})
export class CommonModule {}
