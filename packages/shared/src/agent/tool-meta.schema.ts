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
          '是否把本次结果用该工具对应的前端视图呈现给用户（列表、卡片、图表或其他界面）。按用户要的交付物判断，不按这次调用是不是最后一步。' +
            'true：用户要的就是这个视图里的内容（浏览、打开、筛选后直接看），且本次返回的数据就是要呈现的那份。' +
            'false：用户要的是判断、归类、统计、建议或后续办理，调用只是取证，结论写在回复里。' +
            '即使数据已经齐了，也不要为了对照再调一次并把 display 设为 true。' +
            '例：「哪些用户是测试数据」的每一次查询都是 false。'
        )
    })
    .describe('工具调用元数据')
})
