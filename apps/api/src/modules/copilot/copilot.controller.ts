import { All, Controller, Inject, Next, Req, Res } from '@nestjs/common'

import { BypassTransform, Public } from '@/common'

import { CopilotService } from './copilot.service'

import type { NextFunction, Request, Response } from 'express'

@Controller('copilot')
export class CopilotController {
  constructor(@Inject(CopilotService) private readonly copilotService: CopilotService) {}

  @Public()
  @BypassTransform()
  @All('*path')
  call(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    const handler = this.copilotService.getHandler()

    return handler(req, res, next)
  }
}
