import { validate } from './validate.js'

const productionEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://zen:strong-password@database:5432/zen',
  JWT_SECRET: 'a-production-secret-that-is-long-enough',
  CORS_ORIGIN: 'https://zen.example.com',
  STORAGE_SECRET_KEY: 'a-production-storage-secret',
  COPILOT_THROTTLE_LIMIT: '120'
}

describe('environment validation', () => {
  it.each([
    ['wildcard CORS', { CORS_ORIGIN: '*' }],
    ['placeholder JWT secret', { JWT_SECRET: 'change-me-in-production-change-me' }],
    [
      'placeholder database credentials',
      { DATABASE_URL: 'postgresql://admin:admin123@zen-postgres:5432/admin_dev' }
    ],
    ['default object storage secret', { STORAGE_SECRET_KEY: 'zenminio_secret' }]
  ])('rejects %s in production', (_label, override) => {
    expect(() => validate({ ...productionEnv, ...override })).toThrow(
      /环境变量校验失败|production environment/i
    )
  })

  it('accepts explicit production origins and non-placeholder secrets', () => {
    expect(validate(productionEnv)).toMatchObject({
      NODE_ENV: 'production',
      CORS_ORIGIN: ['https://zen.example.com']
    })
  })

  it('keeps development defaults available', () => {
    expect(
      validate({
        NODE_ENV: 'development',
        JWT_SECRET: 'a-development-secret-that-is-long-enough'
      })
    ).toMatchObject({ NODE_ENV: 'development', CORS_ORIGIN: '*' })
  })
})
