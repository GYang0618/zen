import { Body, Controller, Inject, Post, UsePipes } from '@nestjs/common'
import { createUIMessageStreamResponse } from 'ai'

import { BypassTransform, Public, ZodValidationPipe } from '@/common'

import { ChatService } from './chat.service'
import { callSchema } from './dto/call.dto'

import type { CallDto } from './dto/call.dto'

@Controller('chat')
export class ChatController {
  constructor(@Inject(ChatService) private readonly chatService: ChatService) {}

  @Public()
  @BypassTransform()
  @Post()
  @UsePipes(new ZodValidationPipe(callSchema))
  async call(@Body() callDto: CallDto) {
    const stream = await this.chatService.call(callDto)

    return createUIMessageStreamResponse({ stream })
  }
}
