import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { CONFIG_NAMESPACES } from '@/config'

import type { JwtSignOptions } from '@nestjs/jwt'
import type { AuthConfig } from '@/config'

export interface JwtTokenPayload {
  sub: string
  email: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(CONFIG_NAMESPACES.AUTH)
    private readonly authCfg: AuthConfig
  ) {}

  generateTokenPair(userId: string, email: string): TokenPair {
    const payload: JwtTokenPayload = { sub: userId, email }
    return {
      accessToken: this.signToken(payload, this.authCfg.expiresIn),
      refreshToken: this.signToken(payload, this.authCfg.refreshExpiresIn)
    }
  }

  private signToken(payload: JwtTokenPayload, expiresIn: string): string {
    return this.jwtService.sign(payload, { expiresIn: expiresIn as JwtSignOptions['expiresIn'] })
  }
}
