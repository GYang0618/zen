import { CopilotKitMiddleware, isCopilotRuntimeLedgerPath } from './copilot-kit.middleware.js'

const { jest } = import.meta

function createMiddleware(
  handler = jest.fn(),
  extras: {
    prepareRequest?: ReturnType<typeof jest.fn>
    throttle?: { ttl: number; limit: number }
  } = {}
) {
  const prepareRequest = extras.prepareRequest ?? jest.fn()
  return {
    handler,
    prepareRequest,
    middleware: new CopilotKitMiddleware(
      { getHandler: () => handler, prepareRequest } as never,
      {
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', typ: 'access', permVer: 1 })
      } as never,
      {
        resolve: jest.fn().mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', permVer: 1 })
      } as never,
      { touch: jest.fn().mockResolvedValue(undefined) } as never,
      { copilotThrottle: extras.throttle ?? { ttl: 60_000, limit: 100 } } as never
    )
  }
}

describe('isCopilotRuntimeLedgerPath', () => {
  it('识别 Default Agent runtime 账本路径', () => {
    expect(
      isCopilotRuntimeLedgerPath({
        path: '/api/copilot/runtime/threads',
        originalUrl: '/api/copilot/runtime/threads',
        baseUrl: ''
      })
    ).toBe(true)
    expect(
      isCopilotRuntimeLedgerPath({
        path: '/info',
        originalUrl: '/api/copilot/info',
        baseUrl: '/api/copilot'
      })
    ).toBe(false)
  })
})

describe('CopilotKitMiddleware', () => {
  it('缺少 Bearer 时拒绝并不会调用 Express adapter', async () => {
    const { handler, middleware } = createMiddleware(jest.fn(), {
      throttle: { ttl: 60_000, limit: 100 }
    })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const req = {
      headers: {},
      ip: '10.0.0.1',
      path: '/api/copilot/info',
      originalUrl: '/api/copilot/info',
      get: () => undefined,
      body: {}
    }

    await middleware.use(req as never, res as never, jest.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('认证通过后把请求交给 CopilotKit Express adapter', async () => {
    const { handler, prepareRequest, middleware } = createMiddleware()
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    const req = {
      headers: { authorization: 'Bearer token' },
      ip: '10.0.0.2',
      path: '/api/copilot/info',
      originalUrl: '/api/copilot/info',
      get: () => undefined,
      body: { threadId: 'thread-1', runId: 'run-1' }
    }

    await middleware.use(req as never, res as never, next)

    expect(prepareRequest).toHaveBeenCalled()
    expect(handler).toHaveBeenCalledWith(req, res, next)
  })

  it('已登录 /info 请求把运行时清单交给 Express adapter', async () => {
    const handler = jest.fn((_req, res: { json: (body: unknown) => void }) => {
      res.json({
        agents: [{ name: 'default', id: 'default_agent' }],
        version: 'v2'
      })
    })
    const { middleware } = createMiddleware(handler)
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    const req = {
      headers: { authorization: 'Bearer token' },
      ip: '10.0.0.5',
      path: '/api/copilot/info',
      originalUrl: '/api/copilot/info',
      get: () => undefined,
      body: {}
    }

    await middleware.use(req as never, res as never, next)

    expect(handler).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        agents: [expect.objectContaining({ id: 'default_agent' })]
      })
    )
  })

  it('runtime 账本路径交给后续 Nest Controller，不进入 CopilotKit adapter', async () => {
    const { handler, middleware } = createMiddleware()
    const next = jest.fn()
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const req = {
      headers: { authorization: 'Bearer token' },
      ip: '10.0.0.3',
      path: '/api/copilot/runtime/threads',
      originalUrl: '/api/copilot/runtime/threads',
      get: () => undefined,
      body: {}
    }

    await middleware.use(req as never, res as never, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(handler).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
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
})
