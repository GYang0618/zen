import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { DEFAULT_DEMO_NOTES_CONFIG, demoNotesConfigSchema } from '../config.schema.js'
import { DEMO_NOTES_PLUGIN_ID } from '../constants.js'
import { DemoNotesEventBus } from './event-bus.js'
import { NoteRepository } from './note.repository.js'

import type { AuthContext } from '@zen/shared'
import type { CreateDemoNoteInput, DemoNoteDto, UpdateDemoNoteInput } from '../note.schema.js'

@Injectable()
export class NoteService {
  constructor(
    @Inject(NoteRepository) private readonly noteRepo: NoteRepository,
    @Inject(DemoNotesEventBus) private readonly eventBus: DemoNotesEventBus
  ) {}

  async list(auth: AuthContext): Promise<DemoNoteDto[]> {
    const rows = await this.noteRepo.findMany(auth, auth.tenantId || DEFAULT_TENANT_ID)
    return rows.map(toDto)
  }

  async get(id: string, auth: AuthContext): Promise<DemoNoteDto> {
    const row = await this.noteRepo.findById(id, auth, auth.tenantId || DEFAULT_TENANT_ID)
    if (!row) throw new NotFoundException('便签不存在')
    return toDto(row)
  }

  async create(input: CreateDemoNoteInput, auth: AuthContext): Promise<DemoNoteDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const organizationId = input.organizationId ?? auth.primaryOrgId
    if (!organizationId) {
      throw new BadRequestException('请指定归属组织或设置主职组织')
    }

    const config = await this.resolveConfig(tenantId)
    const count = await this.noteRepo.countByCreator(tenantId, auth.userId)
    if (count >= config.maxNotesPerUser) {
      throw new BadRequestException(`已达到每人便签上限（${config.maxNotesPerUser}）`)
    }

    const created = await this.noteRepo.create({
      tenantId,
      organizationId,
      title: input.title,
      content: input.content,
      createdBy: auth.userId
    })

    this.eventBus.emitNoteCreated({
      noteId: created.id,
      tenantId,
      userId: auth.userId
    })

    return toDto(created)
  }

  async update(id: string, input: UpdateDemoNoteInput, auth: AuthContext): Promise<DemoNoteDto> {
    const existing = await this.noteRepo.findById(id, auth, auth.tenantId || DEFAULT_TENANT_ID)
    if (!existing) throw new NotFoundException('便签不存在')

    const updated = await this.noteRepo.update(id, {
      title: input.title,
      content: input.content,
      organizationId: input.organizationId,
      updatedBy: auth.userId
    })
    return toDto(updated)
  }

  async remove(id: string, auth: AuthContext): Promise<DemoNoteDto> {
    const existing = await this.noteRepo.findById(id, auth, auth.tenantId || DEFAULT_TENANT_ID)
    if (!existing) throw new NotFoundException('便签不存在')

    const deleted = await this.noteRepo.softDelete(id, auth.userId)
    return toDto(deleted)
  }

  private async resolveConfig(tenantId: string) {
    const installation = await this.noteRepo.getPluginConfig(tenantId, DEMO_NOTES_PLUGIN_ID)
    const parsed = demoNotesConfigSchema.safeParse(installation?.config ?? {})
    return parsed.success ? parsed.data : DEFAULT_DEMO_NOTES_CONFIG
  }
}

function toDto(row: {
  id: string
  tenantId: string
  organizationId: string
  title: string
  content: string | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
}): DemoNoteDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    organizationId: row.organizationId,
    title: row.title,
    content: row.content,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}
