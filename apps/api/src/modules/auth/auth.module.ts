import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { authConfig } from '@/config'

import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

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
  providers: [AuthService],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
