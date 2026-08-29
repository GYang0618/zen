/** 前端 useRenderTool / Generative UI 已渲染工具结果时的回复约束 */
const FRONTEND_RENDERED_TOOLS = ['query_users_list', 'query_job_profiles_list'] as const

const frontendRenderedToolList = FRONTEND_RENDERED_TOOLS.map((name) => `\`${name}\``).join('、')

export const GENERATIVE_UI_REPLY_RULES = `
## Generative UI 回复规则

下列工具的结果已由前端专用 UI 直接渲染在对话中：${frontendRenderedToolList}

当本次调用了上述任一工具时：
- 只用 2–3 句话概括执行情况：是否成功、命中条数、所用筛选条件、以及用户可能关心的结论。
- 禁止用 Markdown 表格、JSON、代码块或逐条列表重复展示工具返回的数据。
- 不要复述界面上已可见的字段；用户能在 UI 中查看完整记录。

当本次只调用了未列入的工具时：
- 可按结果类型选择合适的展示方式（关键字段摘要、简短列表或执行情况说明）。
- 仍避免整段粘贴原始 JSON。

若一次回复中同时包含两类工具：有前端 UI 的只做文字摘要，其余按需展示。
`.trim()
