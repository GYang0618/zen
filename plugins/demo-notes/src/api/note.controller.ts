import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  CurrentAuth,
  RequirePermission,
  RequirePlugin,
  ZodValidationPipe
} from '@zen/plugin-sdk/nest'

import { DEMO_NOTE_PERMISSIONS, DEMO_NOTES_PLUGIN_ID } from '../constants.js'
import { createDemoNoteSchema, updateDemoNoteSchema } from '../note.schema.js'
import { NoteService } from './note.service.js'

import type { AuthContext } from '@zen/shared'
import type { CreateDemoNoteInput, DemoNoteDto, UpdateDemoNoteInput } from '../note.schema.js'

@ApiTags('演示便签')
@ApiBearerAuth('access-token')
@RequirePlugin(DEMO_NOTES_PLUGIN_ID)
@Controller('demo/notes')
export class NoteController {
  constructor(@Inject(NoteService) private readonly noteService: NoteService) {}

  @Get()
  @RequirePermission(DEMO_NOTE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '便签列表' })
  @ApiOkResponse({ description: '查询成功' })
  list(@CurrentAuth() auth: AuthContext): Promise<DemoNoteDto[]> {
    return this.noteService.list(auth)
  }

  @Get(':id')
  @RequirePermission(DEMO_NOTE_PERMISSIONS.GET)
  @ApiOperation({ summary: '便签详情' })
  get(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<DemoNoteDto> {
    return this.noteService.get(id, auth)
  }

  @Post()
  @RequirePermission(DEMO_NOTE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: '创建便签' })
  create(
    @Body(new ZodValidationPipe(createDemoNoteSchema)) body: CreateDemoNoteInput,
    @CurrentAuth() auth: AuthContext
  ): Promise<DemoNoteDto> {
    return this.noteService.create(body, auth)
  }

  @Patch(':id')
  @RequirePermission(DEMO_NOTE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: '更新便签' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDemoNoteSchema)) body: UpdateDemoNoteInput,
    @CurrentAuth() auth: AuthContext
  ): Promise<DemoNoteDto> {
    return this.noteService.update(id, body, auth)
  }

  @Delete(':id')
  @RequirePermission(DEMO_NOTE_PERMISSIONS.DELETE)
  @ApiOperation({ summary: '删除便签' })
  remove(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<DemoNoteDto> {
    return this.noteService.remove(id, auth)
  }
}
