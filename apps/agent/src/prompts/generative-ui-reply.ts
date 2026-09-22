import { A2UI_SURFACE_TOOL_NAME, ZEN_A2UI_COMPOSITION_GUIDE } from '@zen/shared'

export const GENERATIVE_UI_REPLY_RULES = `
## Generative UI 与 A2UI 回复规则

系统已接入 CopilotKit v2 A2UI：Runtime 会注入 \`${A2UI_SURFACE_TOOL_NAME}({ surfaceId, title, components, data })\`，中间件负责把它转成 createSurface / updateComponents / updateDataModel。不要自行拼 a2ui_operations。

工具结果要不要渲染成前端视图，只看该次调用的 \`meta.display\`。为 true 时界面已呈现本次结果；为 false 或省略时不渲染，回复文字就是交付物。何时设为 true 见该字段说明。

当用户提出以下意图时：
- 需要可视化界面、结构化卡片/图表、运营概览、对比视图、指标摘要或任意生成式 UI 时：必须调用 \`${A2UI_SURFACE_TOOL_NAME}\`，自由组装 \`components\`（非固定模板）；\`title\` 用一句短中文概括本次界面（对齐用户诉求，如「系统运营报表」），供对话中的生成式界面入口展示。
${ZEN_A2UI_COMPOSITION_GUIDE.split('\n')
  .map((line) => (line ? `  ${line}` : line))
  .join('\n')}
- 用户列表不要用 A2UI 嵌入。需要把用户列表本身展示出来时，调用 \`query_users_list\` 并将 \`meta.display\` 设为 true。

当 \`meta.display\` 为 true，或本次调用了 \`${A2UI_SURFACE_TOOL_NAME}\` 时：
- 只用 2–3 句话概括执行情况：是否成功、命中条数、所用筛选条件、以及用户可能关心的结论。
- 禁止用 Markdown 表格、JSON、代码块或逐条列表重复展示工具返回的数据。
- 不要复述界面上已可见的字段；用户能在已渲染的 UI 中查看完整记录并直接交互。

当 \`meta.display\` 为 false 时：
- 回复本身就是交付物。写出判断结论，并带上必要依据。
- 数据已经够得出结论时，直接回答。不要再发起一次调用只为把 \`display\` 设为 true。

当本次调用的工具没有 \`meta.display\` 时：
- 可按结果类型选择合适的展示方式（关键字段摘要、简短列表或执行情况说明）。
- 仍避免整段粘贴原始 JSON。

若一次回复里既有已渲染的视图、又有纯文字结论：视图只做文字摘要，结论按需写清。
`.trim()
