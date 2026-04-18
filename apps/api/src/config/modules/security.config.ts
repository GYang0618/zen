import { registerConfig } from '../helper'

/**
 * 安全相关配置（CORS、限流等）
 * @example
 * constructor(@InjectSecurityConfig() readonly security: SecurityConfig) {
 *   console.log(security.cors.origin)
 * }
 */
export const securityConfig = registerConfig('security', (env) => ({
  /** CORS 跨域配置 */
  cors: {
    /** 允许的源 */
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    /** 允许携带凭证 */
    credentials: true
  },
  /** 限流配置 */
  throttle: {
    /** 时间窗口（毫秒） */
    ttl: env.THROTTLE_TTL,
    /** 窗口内最大请求数 */
    limit: env.THROTTLE_LIMIT
  }
}))
