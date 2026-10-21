/** 数据字典与空间管理准则 */
export const DICTIONARY_TOOL_RULES = `
## 数据字典与空间管理

数据字典空间（分类目录）：
- 空间列表与统计：创建字典前必须先调用 query_dictionary_workspaces 获取当前空间列表及统计，选择或核实所属空间 folderId，严禁凭空编造 ID。
- 动态仪表盘规范：字典看板使用该接口 stats。kindDistribution、itemStatusDistribution 给 DonutChart；workspaceRanking 给 HorizontalBarChart；allCount、itemCount、starredCount、unassignedCount 给 StatCard。不要为了出图去翻字典列表累加。
- 创建空间：当用户需要新的空间或字典分类时，调用 create_dictionary_workspace，名称不能为空且最多80字符。
- 更新与删除空间：使用 update_dictionary_workspace 修改空间名称；删除空间 delete_dictionary_workspace 前应确认空间下无关键字典或已将字典迁移。

数据字典与字典项：
- 编码规范：字典编码 code 必须以小写字母开头，仅包含小写字母、数字与下划线（如 sys_user_status、biz_order_type），创建后不可修改。创建前先调用 query_dictionaries_list 核实编码是否已存在。
- 字典性质：kind 支持 business（业务字典）和 system（系统字典），默认优先为 business。
- 字典项维护：创建 create_dictionary 或更新 update_dictionary_info 时可包含 items 数组（每项包含 label、value、description、sort 及 status: ACTIVE/DISABLED）。注意更新字典时的 items 为覆盖式全量替换，需传入该字典保留的完整字典项列表。
- 详情查询：列表 query_dictionaries_list 仅返回项数量 itemCount 等摘要信息；查看或对照具体字典项列表必须调用 query_dictionary_detail。
- 快捷操作：切换字典加星标/取消收藏优先使用 toggle_dictionary_star。
- 删除字典：delete_dictionary 会同步级联删除字典下的所有字典项，属于破坏性操作。
`.trim()
