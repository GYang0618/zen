import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UsePipes
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger'
import {
  completeUploadSchema,
  createUploadIntentSchema,
  fileAccessQuerySchema,
  fileListQuerySchema,
  PermissionCode
} from '@zen/shared'

import { AllowAuthenticated } from '@/common/decorators/allow-authenticated.decorator'
import { CurrentAuth } from '@/common/decorators/current-auth.decorator'
import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { RequireStepUp } from '@/common/decorators/require-step-up.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import { StorageService } from './storage.service'

import type {
  AuthContext,
  CompleteUpload,
  CreateUploadIntent,
  FileAccessQuery,
  FileAccessUrl,
  FileAsset,
  FileListQuery,
  FileListResponse,
  UploadIntent
} from '@zen/shared'
import type { StoragePolicy } from './storage.policy'

@ApiTags('对象存储')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('storage')
export class StorageController {
  constructor(@Inject(StorageService) private readonly storageService: StorageService) {}

  @Post('uploads')
  @AllowAuthenticated()
  @ApiOperation({
    summary: '创建上传意图',
    description: '签发预签名 PUT；头像 purpose 不要求文件上传权限。'
  })
  @ApiCreatedResponse({ description: '创建成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createUploadIntentSchema))
  createIntent(
    @Body() body: CreateUploadIntent,
    @CurrentAuth() auth: AuthContext
  ): Promise<UploadIntent> {
    return this.storageService.createIntent(body, auth)
  }

  @Post('uploads/:id/complete')
  @AllowAuthenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '完成上传', description: '校验对象大小与类型后将文件标记为就绪。' })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiOkResponse({ description: '完成成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(completeUploadSchema))
  complete(
    @Param('id') id: string,
    @Body() body: CompleteUpload,
    @CurrentAuth() auth: AuthContext
  ): Promise<FileAsset> {
    return this.storageService.complete(id, auth, body.checksum)
  }

  @Delete('uploads/:id')
  @AllowAuthenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '取消上传', description: '仅能取消未完成的上传会话。' })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiStandardErrorResponses()
  abort(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<void> {
    return this.storageService.abort(id, auth)
  }

  @Get('files')
  @RequirePermission(PermissionCode.FILE_LIST)
  @ApiOperation({
    summary: '分页查询文件',
    description: '按数据范围过滤可见文件元数据，不返回存储键。'
  })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(fileListQuerySchema, { types: ['query'] }))
  list(@Query() query: FileListQuery, @CurrentAuth() auth: AuthContext): Promise<FileListResponse> {
    return this.storageService.list(query, auth)
  }

  @Get('files/:id')
  @RequirePermission(PermissionCode.FILE_READ)
  @ApiOperation({ summary: '获取文件元数据' })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  getOne(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<FileAsset> {
    return this.storageService.getOne(id, auth)
  }

  @Get('files/:id/url')
  @RequirePermission(PermissionCode.FILE_READ)
  @ApiOperation({
    summary: '签发短时访问地址',
    description: 'disposition=inline 用于站内预览，attachment 用于下载。'
  })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiOkResponse({ description: '签发成功' })
  @ApiStandardErrorResponses()
  createDownloadUrl(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(fileAccessQuerySchema, { types: ['query'] }))
    query: FileAccessQuery,
    @CurrentAuth() auth: AuthContext
  ): Promise<FileAccessUrl> {
    return this.storageService.createDownloadUrl(id, auth, query.disposition)
  }

  @Delete('files/:id')
  @RequirePermission(PermissionCode.FILE_DELETE)
  @ApiOperation({ summary: '移入回收站' })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiStandardErrorResponses()
  softDelete(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<FileAsset> {
    return this.storageService.softDelete(id, auth)
  }

  @Post('files/:id/restore')
  @RequirePermission(PermissionCode.FILE_RESTORE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从回收站恢复' })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiOkResponse({ description: '恢复成功' })
  @ApiStandardErrorResponses()
  restore(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<FileAsset> {
    return this.storageService.restore(id, auth)
  }

  @Delete('files/:id/purge')
  @RequirePermission(PermissionCode.FILE_PURGE)
  @RequireStepUp()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '彻底删除', description: '不可逆清除对象与元数据，需二次确认令牌。' })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiStandardErrorResponses()
  purge(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<void> {
    return this.storageService.purge(id, auth)
  }

  @Get('policies')
  @RequirePermission(PermissionCode.STORAGE_READ)
  @ApiOperation({ summary: '查看存储策略' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  listPolicies(): StoragePolicy[] {
    return this.storageService.listPolicies()
  }
}
