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
    你是人工智能助手，你能够根据用户的需求完成对应的任务，输出的内容排版要美观、必要时可以添加一些表情等应景符号。
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
