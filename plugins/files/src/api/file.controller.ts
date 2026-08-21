import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentAuth, RequirePermission, RequirePlugin, ZodValidationPipe } from '@zen/plugin-sdk/nest'

import { FILE_PERMISSIONS, FILES_PLUGIN_ID } from '../constants'
import { createFileSchema } from '../file.schema'
import { FileService } from './file.service'

import type { Response } from 'express'
import type { AuthContext } from '@zen/shared'
import type { CreateFileInput, StoredFileDto } from '../file.schema'

const MAX_FILE_SIZE = 10 * 1024 * 1024

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

  @Post('upload')
  @RequirePermission(FILE_PERMISSIONS.MANAGE)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  upload(
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @CurrentAuth() auth: AuthContext
  ): Promise<StoredFileDto> {
    return this.fileService.upload(file, auth)
  }

  @Get(':id/download')
  @RequirePermission(FILE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '下载/预览文件' })
  async download(
    @Param('id') id: string,
    @CurrentAuth() auth: AuthContext,
    @Res() res: Response
  ): Promise<void> {
    const { stream, mimeType, filename } = await this.fileService.getFileStream(id, auth)
    if (mimeType) {
      res.setHeader('Content-Type', mimeType)
    }
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`)
    stream.pipe(res)
  }

  @Delete(':id')
  @RequirePermission(FILE_PERMISSIONS.MANAGE)
  @ApiOperation({ summary: '删除文件（软删除）' })
  remove(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<StoredFileDto> {
    return this.fileService.remove(id, auth)
  }
}
