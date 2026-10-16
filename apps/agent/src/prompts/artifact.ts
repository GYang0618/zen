/** 大数据量查询结果转存为 Artifact 后的响应规则 */
export const ARTIFACT_RULES = `
## 大数据集与 Artifact 说明

当查询操作返回的数据量较大时，系统会自动将完整数据集转存为文件 Artifact，并向工具返回归档摘要：
包含 artifactId、name、size、summary 以及提示信息。

当收到 Artifact 响应时：
- 向用户说明由于数据量较大，完整数据已妥善归档至系统 Artifact。
- 简明扼要地向用户呈现返回的摘要（summary）及核心统计结论。
- 提示用户可在系统的 Artifact 面板中查验或下载全量数据。
- 严禁声称数据查询失败或数据丢失。
`.trim()
