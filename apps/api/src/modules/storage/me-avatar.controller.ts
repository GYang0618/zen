import { Body, Controller, Inject, Param, Post, UsePipes } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger'
import { completeUploadSchema, createUploadIntentSchema } from '@zen/shared'

import { AllowAuthenticated } from '../../common/decorators/allow-authenticated.decorator.js'
import { CurrentAuth } from '../../common/decorators/current-auth.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import { StorageService } from './storage.service.js'

import type {
  AuthContext,
  CompleteUpload,
  CreateUploadIntent,
  FileAsset,
  UploadIntent
} from '@zen/shared'

@ApiTags('当前用户')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@AllowAuthenticated()
@Controller('me')
export class MeAvatarController {
  constructor(@Inject(StorageService) private readonly storageService: StorageService) {}

  @Post('avatar')
  @ApiOperation({
    summary: '创建头像上传意图',
    description: '已登录即可，不要求文件管理上传权限。'
  })
  @ApiCreatedResponse({ description: '创建成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createUploadIntentSchema))
  createAvatarIntent(
    @Body() body: CreateUploadIntent,
    @CurrentAuth() auth: AuthContext
  ): Promise<UploadIntent> {
    return this.storageService.createIntent({ ...body, purpose: 'avatar' }, auth, {
      forcePurpose: 'avatar'
    })
  }

  @Post('avatar/:id/complete')
  @ApiOperation({ summary: '完成头像上传', description: '完成后将档案头像写为 file:{id}。' })
  @ApiParam({ name: 'id', description: '文件 ID' })
  @ApiOkResponse({ description: '完成成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(completeUploadSchema))
  completeAvatar(
    @Param('id') id: string,
    @Body() _body: CompleteUpload,
    @CurrentAuth() auth: AuthContext
  ): Promise<FileAsset> {
    return this.storageService.completeAvatar(id, auth)
  }
}
