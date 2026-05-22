import { All, Controller, Inject, Next, Req, Res } from '@nestjs/common'

import { CopilotService } from './copilot.service'
import { extractBearerToken } from './copilot-token.util'

import type { NextFunction, Request, Response } from 'express'

@Controller('copilot')
export class CopilotController {
  constructor(@Inject(CopilotService) private readonly copilotService: CopilotService) {}

  @All('*path')
  call(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    const accessToken = extractBearerToken(req.headers)
    const handler = this.copilotService.getHandler(accessToken)

    return handler(req, res, next)
  }
}
