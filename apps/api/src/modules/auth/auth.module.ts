import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { authConfig } from '../../config/index.js'
import { UserModule } from '../user/user.module.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { AuthTokenService } from './auth.token.service.js'

import type { ConfigType } from '@nestjs/config'

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.secret,
        signOptions: { expiresIn: config.expiresIn as never }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
