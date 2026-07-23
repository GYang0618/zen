import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { FILE_PERMISSIONS, FILES_PLUGIN_ID } from '../constants'
import { createFileSchema } from '../file.schema'
import { CurrentAuth } from './current-auth'
import { FileService } from './file.service'
import { RequirePermission, RequirePlugin } from './nest-decorators'
import { ZodValidationPipe } from './zod-validation.pipe'

import type { AuthContext } from '@zen/shared'
import type { CreateFileInput, StoredFileDto } from '../file.schema'

@ApiTags('文件管理')
@ApiBearerAuth('access-token')
@RequirePlugin(FILES_PLUGIN_ID)
@Controller('files')
export class FileController {
  constructor(@Inject(FileService) private readonly fileService: FileService) {}

  @Get()
  @RequirePermission(FILE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '我的文件列表' })
  @ApiOkResponse({ description: '查询成功' })
  list(@CurrentAuth() auth: AuthContext): Promise<StoredFileDto[]> {
    return this.fileService.list(auth)
  }

  @Post()
  @RequirePermission(FILE_PERMISSIONS.MANAGE)
  @ApiOperation({ summary: '创建文件元数据' })
  create(
    @Body(new ZodValidationPipe(createFileSchema)) body: CreateFileInput,
    @CurrentAuth() auth: AuthContext
  ): Promise<StoredFileDto> {
    return this.fileService.create(body, auth)
  }

  @Delete(':id')
  @RequirePermission(FILE_PERMISSIONS.MANAGE)
  @ApiOperation({ summary: '删除文件（软删除）' })
  remove(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<StoredFileDto> {
    return this.fileService.remove(id, auth)
  }
}
