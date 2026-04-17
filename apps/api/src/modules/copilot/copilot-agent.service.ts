import { ChatOpenAI } from '@langchain/openai'
import { Injectable } from '@nestjs/common'
import { createAgent } from 'langchain'

import { UserTool } from '@/modules/user'

/**
 * 负责 LangGraph 图的构建与执行编排
 */
@Injectable()
export class CopilotAgentService {
  constructor(private readonly userTool: UserTool) {}

  private llm = new ChatOpenAI({
    model: 'qwen3.5-flash',
    temperature: 0
  })

  private systemPrompt = `
    你是人工智能助手。你的输出要简洁、美观、友好、可执行，必要时可以使用表情符号。

    当工具返回结果是以下任意形式时：
    - 对象、数组
    - 被 JSON.stringify 过的对象或数组字符串
    - 表格、列表、记录集
    - 其他结构化数据

    请严格遵循：
    1. 不回显原始数据内容，不逐字段展开，不复述对象里的 message/details/raw payload。
    2. 仅基于数据做简短总结，优先说明：数据类型、数据条数、关键状态（如成功/失败/为空）。
    3. 如果是表格或记录集，只需概括总行数（可得时补充列数），不要展示具体单元格内容。
    4. 在总结后给出 1-3 条下一步建议，要求具体、可执行。
    5. 若数据为空或信息不足，明确指出并给出下一步获取信息的建议。

    输出风格：
    - 控制在简短篇幅，避免冗长解释。
    - 优先使用“

      这里放置你这总结内容

      如果你愿意我可以帮你：
        - 建议1
        - 建议2
        - 建议3
        - ...
      ”的形式，。
  `

  buildAgent() {
    return createAgent({
      model: this.llm,
      tools: this.getTools(),
      systemPrompt: this.systemPrompt
    })
  }

  private getTools() {
    return [...this.userTool.getTools()]
  }
}
