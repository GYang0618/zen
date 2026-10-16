import { validate } from './validate.js'

const productionEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://zen:strong-password@database:5432/zen',
  JWT_SECRET: 'a-production-secret-that-is-long-enough',
  CORS_ORIGIN: 'https://zen.example.com',
  STORAGE_SECRET_KEY: 'a-production-storage-secret',
  COPILOT_THROTTLE: '120/m'
}

describe('environment validation', () => {
  it.each([
    ['wildcard CORS', { CORS_ORIGIN: '*' }],
    ['placeholder JWT secret', { JWT_SECRET: 'change-me-in-production-change-me' }],
    [
      'placeholder database credentials',
      { DATABASE_URL: 'postgresql://admin:admin123@zen-postgres:5432/admin_dev' }
    ],
    ['default object storage secret', { STORAGE_SECRET_KEY: 'zenminio_secret' }],
    ['invalid throttle expression', { THROTTLE: 'invalid_format' }]
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
    ).toMatchObject({
      NODE_ENV: 'development',
      CORS_ORIGIN: '*',
      THROTTLE: 'off',
      COPILOT_THROTTLE: 'off'
    })
  })

  it('handles THROTTLE and COPILOT_THROTTLE defaults and overrides', () => {
    const devParsed = validate({
      NODE_ENV: 'development',
      JWT_SECRET: 'a-development-secret-that-is-long-enough'
    })
    expect(devParsed.THROTTLE).toBe('off')
    expect(devParsed.COPILOT_THROTTLE).toBe('off')

    const prodParsed = validate({
      ...productionEnv,
      COPILOT_THROTTLE: undefined
    })
    expect(prodParsed.THROTTLE).toBe('100/m')
    expect(prodParsed.COPILOT_THROTTLE).toBe('60/m')

    const overridden = validate({
      NODE_ENV: 'development',
      JWT_SECRET: 'a-development-secret-that-is-long-enough',
      THROTTLE: '50/10s',
      COPILOT_THROTTLE: '20/s'
    })
    expect(overridden.THROTTLE).toBe('50/10s')
    expect(overridden.COPILOT_THROTTLE).toBe('20/s')
  })
})
