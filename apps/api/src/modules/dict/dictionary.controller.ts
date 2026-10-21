import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UsePipes
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  createDictionarySchema,
  PermissionCode,
  updateDictionarySchema,
  workspaceCreateSchema,
  workspaceUpdateSchema
} from '@zen/shared'
import { z } from 'zod'

import { RequirePermission } from '../../common/decorators/require-permission.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import { PrismaService } from '../../infra/prisma/index.js'

import type { Prisma } from '@prisma/client'
import type {
  CreateDictionaryInput,
  DictKind,
  DictStatus,
  UpdateDictionaryInput,
  WorkspaceCreateInput,
  WorkspaceUpdateInput
} from '@zen/shared'

const toggleStarSchema = z.object({
  isStarred: z.boolean()
})

@ApiTags('数据字典 v2')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('dictionary')
@ApiStandardErrorResponses()
export class DictionaryController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('workspaces')
  @RequirePermission(PermissionCode.DICT_LIST)
  @ApiOperation({ summary: '获取全部空间列表与统计' })
  async listWorkspaces() {
    const [allCount, starredCount, folders] = await this.prisma.$transaction([
      this.prisma.dictType.count(),
      this.prisma.dictType.count({ where: { isStarred: true } }),
      this.prisma.dictFolder.findMany({
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { dictionaries: true } } }
      })
    ])

    return {
      stats: { allCount, starredCount },
      workspaces: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        dictionaryCount: folder._count.dictionaries,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString()
      }))
    }
  }

  @Post('workspaces')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '新增空间' })
  @UsePipes(new ZodValidationPipe(workspaceCreateSchema))
  async createWorkspace(@Body() payload: WorkspaceCreateInput) {
    const folder = await this.prisma.dictFolder.create({
      data: { name: payload.name.trim() },
      include: { _count: { select: { dictionaries: true } } }
    })

    return {
      id: folder.id,
      name: folder.name,
      dictionaryCount: folder._count.dictionaries,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString()
    }
  }

  @Patch('workspaces/:id')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '更新空间名称' })
  @UsePipes(new ZodValidationPipe(workspaceUpdateSchema))
  async updateWorkspace(@Param('id') id: string, @Body() payload: WorkspaceUpdateInput) {
    const folder = await this.prisma.dictFolder.update({
      where: { id },
      data: { name: payload.name.trim() },
      include: { _count: { select: { dictionaries: true } } }
    })

    return {
      id: folder.id,
      name: folder.name,
      dictionaryCount: folder._count.dictionaries,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString()
    }
  }

  @Delete('workspaces/:id')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '删除空间' })
  async deleteWorkspace(@Param('id') id: string) {
    await this.prisma.dictFolder.delete({ where: { id } })
    return { id }
  }

  @Get('list')
  @RequirePermission(PermissionCode.DICT_LIST)
  @ApiOperation({ summary: '根据空间、关键字和性质查询字典列表' })
  async listDictionaries(
    @Query('workspaceId') workspaceId?: string,
    @Query('search') search?: string,
    @Query('kind') kind?: string
  ) {
    const where: Prisma.DictTypeWhereInput = {}

    if (workspaceId === 'starred') {
      where.isStarred = true
    } else if (workspaceId && workspaceId !== 'all') {
      where.folderId = workspaceId
    }

    if (kind === 'business' || kind === 'system') {
      where.kind = kind
    }

    const trimmedSearch = search?.trim()
    if (trimmedSearch) {
      where.OR = [
        { name: { contains: trimmedSearch, mode: 'insensitive' } },
        { code: { contains: trimmedSearch, mode: 'insensitive' } },
        { description: { contains: trimmedSearch, mode: 'insensitive' } }
      ]
    }

    const dictionaries = await this.prisma.dictType.findMany({
      where,
      orderBy: [{ isStarred: 'desc' }, { updatedAt: 'desc' }],
      include: {
        folder: { select: { id: true, name: true } },
        _count: { select: { items: true } }
      }
    })

    return dictionaries.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      kind: item.kind as DictKind,
      isStarred: item.isStarred,
      folderId: item.folderId,
      folderName: item.folder?.name ?? null,
      itemCount: item._count.items,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }))
  }

  @Get(':id')
  @RequirePermission(PermissionCode.DICT_LIST)
  @ApiOperation({ summary: '获取字典详情（包含选项配置）' })
  async getDictionaryDetail(@Param('id') id: string) {
    const dict = await this.prisma.dictType.findUnique({
      where: { id },
      include: {
        folder: { select: { id: true, name: true } },
        items: { orderBy: { sort: 'asc' } },
        _count: { select: { items: true } }
      }
    })

    if (!dict) {
      throw new NotFoundException('该字典不存在')
    }

    return {
      id: dict.id,
      name: dict.name,
      code: dict.code,
      description: dict.description,
      kind: dict.kind as DictKind,
      isStarred: dict.isStarred,
      folderId: dict.folderId,
      folderName: dict.folder?.name ?? null,
      itemCount: dict._count.items,
      createdAt: dict.createdAt.toISOString(),
      updatedAt: dict.updatedAt.toISOString(),
      items: dict.items.map((item) => ({
        id: item.id,
        label: item.label,
        value: item.value,
        description: item.description,
        sort: item.sort,
        status: item.status as DictStatus
      }))
    }
  }

  @Post()
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '创建字典及字典项' })
  @UsePipes(new ZodValidationPipe(createDictionarySchema))
  async createDictionary(@Body() payload: CreateDictionaryInput) {
    const existing = await this.prisma.dictType.findUnique({
      where: { code: payload.code.trim() }
    })
    if (existing) {
      throw new ConflictException(`字典编码 '${payload.code}' 已存在`)
    }

    const dict = await this.prisma.dictType.create({
      data: {
        name: payload.name.trim(),
        code: payload.code.trim(),
        folder: payload.folderId ? { connect: { id: payload.folderId } } : undefined,
        kind: payload.kind ?? 'business',
        description: payload.description?.trim() || null,
        items: payload.items?.length
          ? {
              create: payload.items.map((item, index) => ({
                label: item.label.trim(),
                value: item.value.trim(),
                description: item.description?.trim() || null,
                sort: item.sort ?? index + 1,
                status: item.status ?? 'ACTIVE'
              }))
            }
          : undefined
      },
      include: {
        folder: { select: { id: true, name: true } },
        items: { orderBy: { sort: 'asc' } },
        _count: { select: { items: true } }
      }
    })

    return {
      id: dict.id,
      name: dict.name,
      code: dict.code,
      description: dict.description,
      kind: dict.kind as DictKind,
      isStarred: dict.isStarred,
      folderId: dict.folderId,
      folderName: dict.folder?.name ?? null,
      itemCount: dict._count.items,
      createdAt: dict.createdAt.toISOString(),
      updatedAt: dict.updatedAt.toISOString(),
      items: dict.items.map((item) => ({
        id: item.id,
        label: item.label,
        value: item.value,
        description: item.description,
        sort: item.sort,
        status: item.status as DictStatus
      }))
    }
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '更新字典基础信息及字典项' })
  @UsePipes(new ZodValidationPipe(updateDictionarySchema))
  async updateDictionary(@Param('id') id: string, @Body() payload: UpdateDictionaryInput) {
    const existing = await this.prisma.dictType.findUnique({
      where: { id }
    })
    if (!existing) {
      throw new NotFoundException('该字典不存在')
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.DictTypeUpdateInput = {}
      if (payload.name !== undefined) updateData.name = payload.name.trim()
      if (payload.folderId !== undefined) {
        updateData.folder = payload.folderId
          ? { connect: { id: payload.folderId } }
          : { disconnect: true }
      }
      if (payload.kind !== undefined) updateData.kind = payload.kind
      if (payload.description !== undefined) {
        updateData.description = payload.description?.trim() || null
      }
      if (payload.isStarred !== undefined) updateData.isStarred = payload.isStarred

      if (payload.items !== undefined) {
        await tx.dictItem.deleteMany({
          where: { typeCode: existing.code }
        })

        if (payload.items.length > 0) {
          await tx.dictItem.createMany({
            data: payload.items.map((item, index) => ({
              typeCode: existing.code,
              label: item.label.trim(),
              value: item.value.trim(),
              description: item.description?.trim() || null,
              sort: item.sort ?? index + 1,
              status: item.status ?? 'ACTIVE'
            }))
          })
        }
      }

      return tx.dictType.update({
        where: { id },
        data: updateData,
        include: {
          folder: { select: { id: true, name: true } },
          items: { orderBy: { sort: 'asc' } },
          _count: { select: { items: true } }
        }
      })
    })

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      kind: updated.kind as DictKind,
      isStarred: updated.isStarred,
      folderId: updated.folderId,
      folderName: updated.folder?.name ?? null,
      itemCount: updated._count.items,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      items: updated.items.map((item) => ({
        id: item.id,
        label: item.label,
        value: item.value,
        description: item.description,
        sort: item.sort,
        status: item.status as DictStatus
      }))
    }
  }

  @Patch(':id/star')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '快速切换字典收藏状态' })
  @UsePipes(new ZodValidationPipe(toggleStarSchema))
  async toggleStar(@Param('id') id: string, @Body() payload: z.infer<typeof toggleStarSchema>) {
    const updated = await this.prisma.dictType.update({
      where: { id },
      data: { isStarred: payload.isStarred },
      include: {
        folder: { select: { id: true, name: true } },
        _count: { select: { items: true } }
      }
    })

    return {
      id: updated.id,
      isStarred: updated.isStarred
    }
  }

  @Delete(':id')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '删除字典' })
  async deleteDictionary(@Param('id') id: string) {
    const existing = await this.prisma.dictType.findUnique({
      where: { id }
    })
    if (!existing) {
      throw new NotFoundException('该字典不存在')
    }

    await this.prisma.dictType.delete({ where: { id } })
    return { id }
  }
}
