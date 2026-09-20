import { ChatOpenAI } from '@langchain/openai'
import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  DEFAULT_AGENT_VERSIONS,
  deriveProvisionalThreadTitle,
  isReplaceableProvisionalTitle,
  sanitizeChatModelTitleOutput,
  THREAD_GENERATED_TITLE_MAX_LENGTH
} from '@zen/shared'

import { PrismaService } from '../../infra/prisma/prisma.service.js'
import { CopilotThreadService } from './copilot-thread.service.js'

export interface GenerateTitleFromContentParams {
  threadId: string
  tenantId: string
  userId: string
  agentId?: string
  content: string
}

@Injectable()
export class CopilotTitleService {
  private readonly logger = new Logger(CopilotTitleService.name)

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CopilotThreadService) private readonly threadService: CopilotThreadService
  ) {}

  /**
   * 前端首条消息后主动调用：用消息内容精炼标题并写回（等价一次改标题）。
   * 仅覆盖空标题或临时截断标题，用户手动重命名不受影响。
   */
  async generateTitleFromContent(
    params: GenerateTitleFromContentParams
  ): Promise<{ threadId: string; name: string }> {
    const content = params.content.replace(/\s+/g, ' ').trim()
    if (!content) {
      const existing = await this.threadService.getThread({
        threadId: params.threadId,
        tenantId: params.tenantId,
        userId: params.userId
      })
      return { threadId: params.threadId, name: existing?.name || '新对话' }
    }

    const provisionalTitle = deriveProvisionalThreadTitle(content)
    const thread = await this.threadService.ensureThread({
      threadId: params.threadId,
      tenantId: params.tenantId,
      userId: params.userId,
      agentId: params.agentId ?? 'default',
      title: provisionalTitle
    })

    if (!isReplaceableProvisionalTitle(thread.name, content)) {
      return { threadId: params.threadId, name: thread.name || provisionalTitle }
    }

    const generatedTitle = await this.invokeTitleModel(content, params.threadId)
    const nextTitle = generatedTitle || provisionalTitle

    if (!generatedTitle) {
      this.logger.warn(
        { threadId: params.threadId },
        '标题精炼未生效（无 API Key、模型失败或返回空），侧栏将继续显示临时截断标题'
      )
    } else if (generatedTitle === provisionalTitle) {
      this.logger.debug(
        { threadId: params.threadId },
        '模型返回与临时标题相同（常见于首句较短），未产生可见差异'
      )
    }

    if (nextTitle === thread.name) {
      return { threadId: params.threadId, name: nextTitle }
    }

    const latest = await this.prisma.agentThread.findFirst({
      where: {
        id: params.threadId,
        tenantId: params.tenantId,
        userId: params.userId
      },
      select: { title: true }
    })
    if (!latest || !isReplaceableProvisionalTitle(latest.title, content)) {
      return { threadId: params.threadId, name: latest?.title || nextTitle }
    }

    await this.prisma.agentThread.update({
      where: { id: params.threadId },
      data: { title: nextTitle }
    })

    this.logger.debug(
      { threadId: params.threadId, title: nextTitle, previous: latest.title },
      '已根据首条消息精炼并替换会话标题'
    )

    return { threadId: params.threadId, name: nextTitle }
  }

  private async invokeTitleModel(content: string, threadId: string): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_BASE_URL
    if (!apiKey) return null

    try {
      const model = new ChatOpenAI({
        apiKey,
        configuration: baseURL ? { baseURL } : undefined,
        model: DEFAULT_AGENT_VERSIONS.model ?? 'qwen3.8-27b',
        temperature: 0.3,
        maxTokens: 30
      })

      const prompt = `你是一个会话标题提取助手。请根据用户的首条输入，提炼一个简明扼要的会话标题。
要求：
1. 不超过 10 个汉字或 6 个英文单词；
2. 用主题词概括，不要复述用户原句或整段截断；
3. 不要包含引号、标点符号、前缀或任何多余解释；
4. 只输出标题一行，不要思考过程。

用户输入：
${content.slice(0, 300)}`

      const response = await model.invoke(prompt)
      const text =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content)

      const cleaned = sanitizeChatModelTitleOutput(text)
        .replace(/["'“”`]/g, '')
        .replace(/^标题[:：]/, '')
        .trim()

      if (!cleaned) return null
      return cleaned.slice(0, THREAD_GENERATED_TITLE_MAX_LENGTH)
    } catch (llmError) {
      this.logger.warn({ err: llmError, threadId }, '调用大模型生成会话标题失败，保留临时标题')
      return null
    }
  }
}
