import { CopilotKitMiddleware } from './copilot-kit.middleware.js'

const { jest } = import.meta

function createMiddleware(
  handler = jest.fn(),
  extras: {
    throttle?: { enabled?: boolean; ttl: number; limit: number }
  } = {}
) {
  const authContextService = {
    resolve: jest.fn().mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', permVer: 1 })
  }
  const userActivityService = { touch: jest.fn().mockResolvedValue(undefined) }
  const jwtService = {
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', typ: 'access', permVer: 1 })
  }

  return {
    handler,
    authContextService,
    userActivityService,
    jwtService,
    middleware: new CopilotKitMiddleware(
      { getHandler: () => handler } as never,
      jwtService as never,
      authContextService as never,
      userActivityService as never,
      {
        copilotThrottle: extras.throttle
          ? { enabled: extras.throttle.enabled ?? true, ...extras.throttle }
          : { enabled: true, ttl: 60_000, limit: 100 }
      } as never
    )
  }
}

describe('CopilotKitMiddleware', () => {
  it('匿名或未授权请求直接交给 Express adapter 处理（由 hooks.onRequest 统一校验）', async () => {
    const { handler, middleware } = createMiddleware(jest.fn(), {
      throttle: { ttl: 60_000, limit: 100 }
    })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    const req = {
      headers: {},
      ip: '10.0.0.1',
      path: '/api/copilot/info',
      originalUrl: '/api/copilot/info',
      get: () => undefined,
      body: {}
    }

    await middleware.use(req as never, res as never, next)

    expect(handler).toHaveBeenCalledWith(req, res, next)
  })

  it('认证通过后解析用户上下文并把请求交给 CopilotKit Express adapter', async () => {
    const { handler, authContextService, userActivityService, middleware } = createMiddleware()
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    const req = {
      headers: { authorization: 'Bearer token' },
      ip: '10.0.0.2',
      path: '/api/copilot/info',
      originalUrl: '/api/copilot/info',
      get: () => undefined,
      body: {}
    }

    await middleware.use(req as never, res as never, next)

    expect(authContextService.resolve).toHaveBeenCalledWith('user-1')
    expect(userActivityService.touch).toHaveBeenCalledWith('user-1')
    expect(handler).toHaveBeenCalledWith(req, res, next)
  })

  it('超出 Copilot 独立限流后返回 429', async () => {
    const { handler, middleware } = createMiddleware(jest.fn(), {
      throttle: { ttl: 60_000, limit: 1 }
    })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const req = {
      headers: { authorization: 'Bearer token' },
      ip: '10.0.0.4',
      path: '/api/copilot/info',
      originalUrl: '/api/copilot/info',
      get: () => undefined,
      body: {}
    }

    await middleware.use(req as never, res as never, jest.fn())
    await middleware.use(req as never, res as never, jest.fn())

    expect(res.status).toHaveBeenCalledWith(429)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('当限流未启用（enabled: false）时即使超过请求限制也正常放行', async () => {
    const { handler, middleware } = createMiddleware(jest.fn(), {
      throttle: { enabled: false, ttl: 60_000, limit: 1 }
    })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const req = {
      headers: { authorization: 'Bearer token' },
      ip: '10.0.0.5',
      path: '/api/copilot/info',
      originalUrl: '/api/copilot/info',
      get: () => undefined,
      body: {}
    }

    await middleware.use(req as never, res as never, jest.fn())
    await middleware.use(req as never, res as never, jest.fn())

    expect(res.status).not.toHaveBeenCalledWith(429)
    expect(handler).toHaveBeenCalledTimes(2)
  })
})
