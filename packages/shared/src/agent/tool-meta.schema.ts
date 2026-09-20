import { z } from 'zod'

export const toolCallMetaSchema = z.object({
  meta: z
    .object({
      title: z.string().describe('本次调用的标题'),
      description: z.string().optional().describe('本次调用的描述；较复杂、无法用标题概括时使用'),
      display: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          '是否在前端以表格/卡片形式直接呈现给用户。仅当用户的核心目标是查看、列出、检索当前资源时设为 true；若当前调用仅作为中间步骤，必须设为 false 或省略。'
        )
    })
    .describe('工具调用元数据')
})
