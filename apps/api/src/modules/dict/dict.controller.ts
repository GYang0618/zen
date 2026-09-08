import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UsePipes
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { createDictItemSchema, createDictTypeSchema, PermissionCode } from '@zen/shared'

import { RequirePermission } from '../../common/decorators/require-permission.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import { PrismaService } from '../../infra/prisma/index.js'

import type { CreateDictItem, CreateDictType, DictItem, DictType } from '@zen/shared'

@ApiTags('系统字典')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('dict')
export class DictController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission(PermissionCode.DICT_LIST)
  @ApiOperation({ summary: '获取全部字典类型及条目' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  async listTypes(): Promise<DictType[]> {
    const types = await this.prisma.dictType.findMany({
      include: { items: { orderBy: { sort: 'asc' } } },
      orderBy: { code: 'asc' }
    })
    return types.map((type) => ({
      id: type.id,
      code: type.code,
      name: type.name,
      description: type.description,
      items: type.items.map((item) => ({
        id: item.id,
        typeCode: item.typeCode,
        label: item.label,
        value: item.value,
        sort: item.sort,
        status: item.status === 'ACTIVE' ? 'active' : 'disabled'
      }))
    }))
  }

  @Get(':code')
  @RequirePermission(PermissionCode.DICT_LIST)
  @ApiOperation({ summary: '按类型编码获取字典项' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  async listByCode(@Param('code') code: string): Promise<DictItem[]> {
    const type = await this.prisma.dictType.findUnique({
      where: { code },
      include: { items: { orderBy: { sort: 'asc' } } }
    })
    if (!type) throw new NotFoundException('字典类型不存在')
    return type.items.map((item) => ({
      id: item.id,
      typeCode: item.typeCode,
      label: item.label,
      value: item.value,
      sort: item.sort,
      status: item.status === 'ACTIVE' ? 'active' : 'disabled'
    }))
  }

  @Post('types')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '创建字典类型' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createDictTypeSchema))
  async createType(@Body() payload: CreateDictType): Promise<DictType> {
    const created = await this.prisma.dictType.create({
      data: {
        code: payload.code,
        name: payload.name,
        description: payload.description
      },
      include: { items: true }
    })
    return {
      id: created.id,
      code: created.code,
      name: created.name,
      description: created.description,
      items: []
    }
  }

  @Post('items')
  @RequirePermission(PermissionCode.DICT_MANAGE)
  @ApiOperation({ summary: '创建字典项' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createDictItemSchema))
  async createItem(@Body() payload: CreateDictItem): Promise<DictItem> {
    const type = await this.prisma.dictType.findUnique({ where: { code: payload.typeCode } })
    if (!type) throw new NotFoundException('字典类型不存在')

    const created = await this.prisma.dictItem.create({
      data: {
        typeCode: payload.typeCode,
        label: payload.label,
        value: payload.value,
        sort: payload.sort ?? 0,
        status: payload.status === 'disabled' ? 'DISABLED' : 'ACTIVE'
      }
    })

    return {
      id: created.id,
      typeCode: created.typeCode,
      label: created.label,
      value: created.value,
      sort: created.sort,
      status: created.status === 'ACTIVE' ? 'active' : 'disabled'
    }
  }
}
