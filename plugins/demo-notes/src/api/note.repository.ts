import { Inject, Injectable } from '@nestjs/common'
import { applyOrgScopedResourceDataScope } from '@zen/plugin-sdk'

import { DEMO_NOTES_PRISMA } from './tokens'

import type { Prisma, PrismaClient } from '@prisma/client'
import type { AuthContext } from '@zen/shared'

type DemoNoteRecord = {
  id: string
  tenantId: string
  organizationId: string
  title: string
  content: string | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

@Injectable()
export class NoteRepository {
  constructor(@Inject(DEMO_NOTES_PRISMA) private readonly prisma: PrismaClient) {}

  findMany(auth: AuthContext, tenantId: string) {
    const scope = applyOrgScopedResourceDataScope(auth) as Prisma.DemoNoteWhereInput
    return this.prisma.demoNote.findMany({
      where: {
        tenantId,
        deletedAt: null,
        AND: [scope]
      },
      orderBy: { updatedAt: 'desc' }
    }) as Promise<DemoNoteRecord[]>
  }

  findById(id: string, auth: AuthContext, tenantId: string) {
    const scope = applyOrgScopedResourceDataScope(auth) as Prisma.DemoNoteWhereInput
    return this.prisma.demoNote.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        AND: [scope]
      }
    }) as Promise<DemoNoteRecord | null>
  }

  countByCreator(tenantId: string, createdBy: string) {
    return this.prisma.demoNote.count({
      where: { tenantId, createdBy, deletedAt: null }
    })
  }

  create(data: {
    tenantId: string
    organizationId: string
    title: string
    content?: string | null
    createdBy: string
  }) {
    return this.prisma.demoNote.create({
      data: {
        tenantId: data.tenantId,
        organizationId: data.organizationId,
        title: data.title,
        content: data.content ?? null,
        createdBy: data.createdBy
      }
    }) as Promise<DemoNoteRecord>
  }

  update(
    id: string,
    data: {
      title?: string
      content?: string | null
      organizationId?: string
      updatedBy: string
    }
  ) {
    return this.prisma.demoNote.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        organizationId: data.organizationId,
        updatedBy: data.updatedBy
      }
    }) as Promise<DemoNoteRecord>
  }

  softDelete(id: string, updatedBy: string) {
    return this.prisma.demoNote.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy }
    }) as Promise<DemoNoteRecord>
  }

  getPluginConfig(tenantId: string, pluginId: string) {
    return this.prisma.pluginInstallation.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      select: { config: true }
    })
  }
}
