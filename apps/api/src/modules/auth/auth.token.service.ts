import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { CONFIG_NAMESPACES } from '@/config'

import type { JwtSignOptions } from '@nestjs/jwt'
import type { AuthConfig } from '@/config'

export type JwtTokenType = 'access' | 'refresh'

export interface JwtTokenPayload {
  sub: string
  email: string
  typ: JwtTokenType
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthTokenService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(CONFIG_NAMESPACES.AUTH)
    private readonly authCfg: AuthConfig
  ) {}

  generateTokenPair(userId: string, email: string): TokenPair {
    return {
      accessToken: this.signToken({ sub: userId, email, typ: 'access' }, this.authCfg.expiresIn),
      refreshToken: this.signToken(
        { sub: userId, email, typ: 'refresh' },
        this.authCfg.refreshExpiresIn
      )
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtTokenPayload> {
    const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token)
    if (payload.typ !== 'refresh') {
      throw new Error('Invalid token type')
    }
    return payload
  }

  private signToken(payload: JwtTokenPayload, expiresIn: string): string {
    return this.jwtService.sign(payload, { expiresIn: expiresIn as JwtSignOptions['expiresIn'] })
  }
}
