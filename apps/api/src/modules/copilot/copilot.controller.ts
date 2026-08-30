import { All, Controller, Inject, Next, Req, Res } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'

import { AllowAuthenticated } from '@/common/decorators/allow-authenticated.decorator'
import { CurrentAuth } from '@/common/decorators/current-auth.decorator'

import { CopilotService } from './copilot.service'
import { extractBearerToken } from './copilot-token.util'

import type { AuthContext } from '@zen/shared'
import type { NextFunction, Request, Response } from 'express'

/**
 * CopilotKit 会在连接、鉴权头变化、HMR 时反复打 GET /info，
 * 且本控制器是 catch-all，所有 /copilot/* 共用同一个限流桶。
 * 全局 10 次/60s 会被协议轮询打满，429 后 SDK 重连会把窗口一直续上。
 */
@SkipThrottle()
@AllowAuthenticated()
@Controller('copilot')
export class CopilotController {
  constructor(@Inject(CopilotService) private readonly copilotService: CopilotService) {}

  @All('*path')
  async call(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
    @CurrentAuth() auth: AuthContext
  ) {
    const accessToken = extractBearerToken(req.headers)
    const body = req.body as { threadId?: unknown; runId?: unknown } | undefined
    const threadId = typeof body?.threadId === 'string' ? body.threadId : undefined
    const runId = typeof body?.runId === 'string' ? body.runId : undefined
    const handler = await this.copilotService.getHandler(
      accessToken,
      { auth, traceId: typeof req.id === 'string' ? req.id : undefined },
      threadId,
      runId
    )

    return handler(req, res, next)
  }
}
