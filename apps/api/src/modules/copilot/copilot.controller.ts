import { Body, Controller, Post, UsePipes } from '@nestjs/common'

import { BypassTransform, Public, ZodValidationPipe } from '@/common'

import { CopilotService } from './copilot.service'
import { callSchema } from './dto/call.dto'

import type { CallDto } from './dto/call.dto'

@Controller('copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Public()
  @BypassTransform()
  @Post()
  @UsePipes(new ZodValidationPipe(callSchema))
  run(@Body() callDto: CallDto) {
    return this.copilotService.call(callDto)
  }
}
