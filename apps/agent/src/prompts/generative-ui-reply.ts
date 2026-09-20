import {
  A2UI_SURFACE_TOOL_NAME,
  DEDICATED_RESULT_UI_TOOL_NAMES,
  ZEN_A2UI_COMPOSITION_GUIDE
} from '@zen/shared'

const frontendRenderedToolList = DEDICATED_RESULT_UI_TOOL_NAMES.map((name) => `\`${name}\``).join(
  '、'
)

export const GENERATIVE_UI_REPLY_RULES = `
## Generative UI 与 A2UI 回复规则

系统已接入 CopilotKit v2 A2UI：Runtime 会注入 \`${A2UI_SURFACE_TOOL_NAME}({ surfaceId, title, components, data })\`，中间件负责把它转成 createSurface / updateComponents / updateDataModel。不要自行拼 a2ui_operations。
下列工具的结果已由前端专用 UI 直接渲染：${frontendRenderedToolList}

当用户提出以下意图时：
- 需要可视化界面、结构化卡片/图表、运营概览、对比视图、指标摘要或任意生成式 UI 时：必须调用 \`${A2UI_SURFACE_TOOL_NAME}\`，自由组装 \`components\`（非固定模板）；\`title\` 用一句短中文概括本次界面（对齐用户诉求，如「系统运营报表」），供对话中的生成式界面入口展示。
${ZEN_A2UI_COMPOSITION_GUIDE.split('\n')
  .map((line) => (line ? `  ${line}` : line))
  .join('\n')}
- 仅需要检索或管理用户数据时：调用 \`query_users_list\`（由前端专用工具 UI 呈现，不要用 A2UI 嵌入用户表）。

当本次调用了上述任一工具（或展示用户列表/生成式界面）时：
- 只用 2–3 句话概括执行情况：是否成功、命中条数、所用筛选条件、以及用户可能关心的结论。
- 禁止用 Markdown 表格、JSON、代码块或逐条列表重复展示工具返回的数据。
- 不要复述界面上已可见的字段；用户能在已渲染的 UI 中查看完整记录并直接交互。

当本次只调用了未列入的工具时：
- 可按结果类型选择合适的展示方式（关键字段摘要、简短列表或执行情况说明）。
- 仍避免整段粘贴原始 JSON。

若一次回复中同时包含两类工具：有前端 UI 的只做文字摘要，其余按需展示。
`.trim()
