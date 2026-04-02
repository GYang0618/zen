import { z } from 'zod'

export const envSchema = z
  .object({
    // ==================== 应用配置 ====================
    /** 运行环境：开发/生产/测试 */
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development')
      .describe('应用运行环境'),

    /** 应用名称 */
    APP_NAME: z.string().min(1).max(50).default('Admin').describe('应用名称'),

    /** 应用监听端口 */
    PORT: z.coerce.number().int().min(1).max(65535).default(3000).describe('应用监听端口'),

    /** API 全局前缀 */
    API_PREFIX: z
      .string()
      .regex(/^\/[\d/a-z-]*$/i)
      .default('/api')
      .describe('API 路由前缀'),

    // ==================== 数据库配置 ====================
    /** 数据库连接 URL */
    DATABASE_URL: z.url().describe('数据库连接字符串（PostgreSQL/MySQL/MongoDB 等）'),

    // ==================== JWT 认证配置 ====================
    /** JWT 签名密钥（生产环境必须 ≥ 32 字符） */
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET 必须至少 32 个字符（推荐使用随机生成的强密钥）')
      .describe('JWT 签名密钥'),

    /** JWT 过期时间 */
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+[dhms]$/, '格式：数字+单位（s秒/m分钟/h小时/d天），如 "7d"')
      .default('7d')
      .describe('JWT 令牌有效期'),

    /** JWT 刷新令牌过期时间 */
    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .regex(/^\d+[dhms]$/)
      .default('30d')
      .describe('JWT 刷新令牌有效期'),

    // ==================== 日志配置 ====================
    /** 日志级别 */
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info').describe('日志输出级别'),

    // ==================== CORS 配置 ====================
    /** 允许的跨域源（多个用逗号分隔） */
    CORS_ORIGIN: z
      .string()
      .default('*')
      .transform((val) => (val === '*' ? val : val.split(',').map((str) => str.trim())))
      .describe('CORS 允许的源（生产环境应明确指定）'),

    // ==================== 限流配置 ====================
    /** 限流窗口期（毫秒） */
    THROTTLE_TTL: z.coerce
      .number()
      .int()
      .positive()
      .default(60000)
      .describe('限流时间窗口（毫秒）'),

    /** 限流请求数 */
    THROTTLE_LIMIT: z.coerce
      .number()
      .int()
      .positive()
      .default(10)
      .describe('限流时间窗口内最大请求数'),

    // ==================== Swagger 配置 ====================
    /** 是否启用 Swagger */
    SWAGGER_ENABLED: z.coerce.boolean().default(true).describe('是否启用 Swagger API 文档'),
    /** Swagger 访问路径 */
    SWAGGER_PATH: z.string().default('docs').describe('Swagger 文档访问路径')
  })
  .strict()

export type Env = z.infer<typeof envSchema>
