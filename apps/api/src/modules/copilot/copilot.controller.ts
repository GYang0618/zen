import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { createUIMessageStreamResponse } from 'ai'

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
  async call(@Body() callDto: CallDto) {
    const stream = await this.copilotService.call(callDto)

    return createUIMessageStreamResponse({ stream })
  }
}
