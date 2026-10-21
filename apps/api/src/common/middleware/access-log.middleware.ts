import { normalizeRoutePath, resolveRouteTitle } from '@zen/shared'

import { getRequestAuditContext } from '../auth/request-audit-context.js'
import { resolveTraceId } from '../utils/trace-id.js'

import type { NextFunction, Request, Response } from 'express'
import type { AccessLogSink } from '../access-log/access-log-sink.service.js'
import type { AccessMeta } from '../interceptors/access-meta.interceptor.js'

const SKIP_PATHS = /^\/(health|metrics|favicon\.ico|assets|\.well-known)/i

export function accessLogMiddleware(sink: AccessLogSink) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method.toUpperCase() === 'OPTIONS' || SKIP_PATHS.test(req.path)) {
      return next()
    }

    const start = process.hrtime.bigint()

    res.on('finish', () => {
      const meta = (req as Request & { zenAccess?: AccessMeta }).zenAccess
      const route = meta?.route ?? normalizeRoutePath(req.path)
      const ctx = getRequestAuditContext()

      const latencyMs = Number((process.hrtime.bigint() - start) / 1_000_000n)
      const title = resolveRouteTitle(req.method, route, meta?.summary)

      const traceId = resolveTraceId({
        existingId: (req as Request & { id?: string }).id ?? ctx?.traceId,
        headers: req.headers
      })

      sink.record({
        method: req.method,
        route,
        status: res.statusCode,
        latencyMs,
        title,
        callerType: ctx?.actorType ?? (ctx?.actorId ? 'user' : 'anonymous'),
        userId: ctx?.actorId ?? null,
        tenantId: ctx?.tenantId ?? null,
        traceId,
        agentRunId: ctx?.agentRunId ?? null,
        agentToolName: ctx?.agentToolName ?? null,
        ip: ctx?.ip ?? req.ip ?? null,
        userAgent: req.get('user-agent') ?? null
      })
    })

    next()
  }
}
