import { registerConfig } from '../helper'

/**
 * JWT 认证配置
 */
export const authConfig = registerConfig('auth', (env) => ({
  /** JWT 签名密钥 */
  secret: env.JWT_SECRET,
  /** 访问令牌有效期 */
  expiresIn: env.JWT_EXPIRES_IN,
  /** 刷新令牌有效期 */
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
}))
