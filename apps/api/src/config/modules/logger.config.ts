import { registerConfig } from '../helper'

/**
 * 日志配置
 */
export const loggerConfig = registerConfig('logger', (env) => ({
  /** 日志级别 */
  level: env.LOG_LEVEL,
  /** 是否为开发环境（用于决定日志格式） */
  isDev: env.NODE_ENV === 'development',
  /** 需要脱敏的字段 */
  redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token']
}))
