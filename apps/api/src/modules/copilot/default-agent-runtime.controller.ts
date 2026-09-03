import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { AllowAuthenticated } from '@/common/decorators/allow-authenticated.decorator'
import { CurrentAuth } from '@/common/decorators/current-auth.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH } from '@/common/swagger'

import { DefaultAgentRunControl } from './default-agent-run-control'
import {
  approvalDecisionSchema,
  approvalListQuerySchema,
  artifactCreateSchema,
  evaluationCreateSchema,
  eventListQuerySchema,
  memoryUpsertSchema,
  runListQuerySchema,
  runResumeSchema,
  threadListQuerySchema,
  threadUpdateSchema
} from './default-agent-runtime.schemas'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store'

import type { AuthContext } from '@zen/shared'
import type {
  ApprovalDecisionInput,
  ApprovalListQuery,
  ArtifactCreateInput,
  EvaluationCreateInput,
  EventListQuery,
  MemoryUpsertInput,
  RunListQuery,
  RunResumeInput,
  ThreadListQuery,
  ThreadUpdateInput
} from './default-agent-runtime.schemas'

@ApiTags('Default Agent Runtime')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@AllowAuthenticated()
@Controller('copilot/runtime')
export class DefaultAgentRuntimeController {
  constructor(
    @Inject(DefaultAgentRuntimeStore)
    private readonly store: DefaultAgentRuntimeStore,
    @Inject(DefaultAgentRunControl)
    private readonly runControl: DefaultAgentRunControl
  ) {}

  @Get('threads')
  @ApiOperation({ summary: '查询当前用户的 Default Agent 会话历史' })
  @UsePipes(new ZodValidationPipe(threadListQuerySchema, { types: ['query'] }))
  listThreads(@CurrentAuth() auth: AuthContext, @Query() query: ThreadListQuery) {
    return this.store.listThreads(auth, query)
  }

  @Get('threads/:threadId')
  @ApiOperation({ summary: '加载会话消息、Run 和最新 Checkpoint' })
  getThread(@Param('threadId') threadId: string, @CurrentAuth() auth: AuthContext) {
    return this.store.getThread(threadId, auth)
  }

  @Patch('threads/:threadId')
  @ApiOperation({ summary: '重命名或归档会话' })
  @UsePipes(new ZodValidationPipe(threadUpdateSchema))
  updateThread(
    @Param('threadId') threadId: string,
    @Body() body: ThreadUpdateInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.store.updateThread(threadId, body, auth)
  }

  @Delete('threads/:threadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除当前用户的会话及运行事件' })
  deleteThread(@Param('threadId') threadId: string, @CurrentAuth() auth: AuthContext) {
    return this.store.deleteThread(threadId, auth)
  }

  @Get('runs/:runId/events')
  @ApiOperation({ summary: '按 sequence 游标增量重放 Run 事件' })
  @UsePipes(new ZodValidationPipe(eventListQuerySchema, { types: ['query'] }))
  listEvents(
    @Param('runId') runId: string,
    @CurrentAuth() auth: AuthContext,
    @Query() query: EventListQuery
  ) {
    return this.store.listEvents(runId, auth, query.after, query.limit)
  }

  @Get('runs')
  @ApiOperation({ summary: '查询当前用户的 Default Agent Run' })
  @UsePipes(new ZodValidationPipe(runListQuerySchema, { types: ['query'] }))
  listRuns(@CurrentAuth() auth: AuthContext, @Query() query: RunListQuery) {
    return this.store.listRuns(auth, query)
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: '查询 Run 、Tool、审批与 Artifact 详情' })
  getRun(@Param('runId') runId: string, @CurrentAuth() auth: AuthContext) {
    return this.store.getRun(runId, auth)
  }

  @Post('runs/:runId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消 Run 并将最终状态持久化为 cancelled' })
  async cancelRun(@Param('runId') runId: string, @CurrentAuth() auth: AuthContext) {
    const run = await this.store.cancelRun(runId, auth)
    this.runControl.cancel(runId)
    return run
  }

  @Post('runs/:runId/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从最近 Checkpoint 准备恢复上下文' })
  @UsePipes(new ZodValidationPipe(runResumeSchema))
  prepareRunResume(
    @Param('runId') runId: string,
    @Body() body: RunResumeInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.store.prepareRunResume(runId, body.reason, auth)
  }

  @Post('runs/:runId/artifacts')
  @ApiOperation({ summary: '保存 Tool 大结果为 Artifact' })
  @UsePipes(new ZodValidationPipe(artifactCreateSchema))
  createArtifact(
    @Param('runId') runId: string,
    @Body() body: ArtifactCreateInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.store.createArtifact(runId, body, auth)
  }

  @Get('runs/:runId/artifacts')
  @ApiOperation({ summary: '查询 Run Artifact 列表' })
  listArtifacts(@Param('runId') runId: string, @CurrentAuth() auth: AuthContext) {
    return this.store.listArtifacts(runId, auth)
  }

  @Get('artifacts/:artifactId')
  @ApiOperation({ summary: '查看 Artifact 完整内容' })
  getArtifact(@Param('artifactId') artifactId: string, @CurrentAuth() auth: AuthContext) {
    return this.store.getArtifact(artifactId, auth)
  }

  @Get('approvals')
  @ApiOperation({ summary: '查询 Tool 审批记录' })
  @UsePipes(new ZodValidationPipe(approvalListQuerySchema, { types: ['query'] }))
  listApprovals(@CurrentAuth() auth: AuthContext, @Query() query: ApprovalListQuery) {
    return this.store.listApprovals(auth, query.status)
  }

  @Post('approvals/:id/decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批准或拒绝高风险 Tool' })
  @UsePipes(new ZodValidationPipe(approvalDecisionSchema))
  decideApproval(
    @Param('id') id: string,
    @Body() body: ApprovalDecisionInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.store.decideApproval(id, body.decision, body.reason, auth)
  }

  @Post('approvals/by-interrupt/:interruptId/decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '按 LangGraph interrupt/toolCallId 记录审批决策' })
  @UsePipes(new ZodValidationPipe(approvalDecisionSchema))
  decideApprovalByInterrupt(
    @Param('interruptId') interruptId: string,
    @Body() body: ApprovalDecisionInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.store.decideApprovalByInterrupt(interruptId, body.decision, body.reason, auth)
  }

  @Get('memories')
  @ApiOperation({ summary: '查询当前用户的显式 Agent 记忆' })
  listMemories(@CurrentAuth() auth: AuthContext) {
    return this.store.listMemories(auth)
  }

  @Put('memories')
  @ApiOperation({ summary: '写入或更新显式 Agent 记忆' })
  @UsePipes(new ZodValidationPipe(memoryUpsertSchema))
  upsertMemory(@Body() body: MemoryUpsertInput, @CurrentAuth() auth: AuthContext) {
    return this.store.upsertMemory(body, auth)
  }

  @Delete('memories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除显式 Agent 记忆' })
  deleteMemory(@Param('id') id: string, @CurrentAuth() auth: AuthContext) {
    return this.store.deleteMemory(id, auth)
  }

  @Post('runs/:runId/evaluations')
  @ApiOperation({ summary: '记录 Run 的人工或离线评测结果' })
  @UsePipes(new ZodValidationPipe(evaluationCreateSchema))
  recordEvaluation(
    @Param('runId') runId: string,
    @Body() body: EvaluationCreateInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.store.recordEvaluation(runId, body, auth)
  }

  @Get('metrics')
  @ApiOperation({ summary: '查询当前用户近 24 小时运行指标' })
  getMetrics(@CurrentAuth() auth: AuthContext) {
    return this.store.getMetrics(auth)
  }

  @Post('maintenance/reconcile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '对账当前用户的超时 Run、审批和幂等记录' })
  reconcile(@CurrentAuth() auth: AuthContext) {
    return this.store.reconcile(auth)
  }
}
