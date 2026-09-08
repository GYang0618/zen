import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { CONFIG_NAMESPACES } from '../../config/index.js'

import type { JwtSignOptions } from '@nestjs/jwt'
import type { AuthConfig } from '../../config/index.js'

export type JwtTokenType = 'access' | 'refresh' | 'mfa' | 'step-up'

export interface JwtTokenPayload {
  sub: string
  email: string
  typ: JwtTokenType
  purpose?: string
  /** Access Token 携带权限版本，变更后强制刷新 */
  permVer?: number
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

  generateTokenPair(userId: string, email: string, permVer = 1): TokenPair {
    return {
      accessToken: this.signToken(
        { sub: userId, email, typ: 'access', permVer },
        this.authCfg.expiresIn
      ),
      refreshToken: this.signToken(
        { sub: userId, email, typ: 'refresh' },
        this.authCfg.refreshExpiresIn
      )
    }
  }

  signMfaChallenge(userId: string, email: string): string {
    return this.signToken({ sub: userId, email, typ: 'mfa' }, '5m')
  }

  signStepUp(userId: string, email: string, purpose = 'sensitive'): string {
    return this.signToken({ sub: userId, email, typ: 'step-up', purpose }, '3m')
  }

  async verifyRefreshToken(token: string): Promise<JwtTokenPayload> {
    const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token)
    if (payload.typ !== 'refresh') {
      throw new Error('Invalid token type')
    }
    return payload
  }

  async verifyTypedToken(token: string, typ: JwtTokenType): Promise<JwtTokenPayload> {
    const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token)
    if (payload.typ !== typ) {
      throw new Error('Invalid token type')
    }
    return payload
  }

  private signToken(payload: JwtTokenPayload, expiresIn: string): string {
    return this.jwtService.sign(payload, { expiresIn: expiresIn as JwtSignOptions['expiresIn'] })
  }
}
