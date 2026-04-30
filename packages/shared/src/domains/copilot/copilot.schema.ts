import { z } from 'zod'

import type { UIMessage } from 'ai'

export const copilotCallSchema = z.object({
  id: z.string().optional(),
  messages: z.custom<UIMessage[]>(),
  /**
   * 是否开启模型的“思考/推理”模式。
   * 默认关闭：不向模型请求 reasoning 相关能力。
   */
  enableThinking: z.boolean().optional().default(false)
})
