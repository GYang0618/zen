/** 用户附件挂载到 Deep Agents 文件系统后的读写与导出规则 */
export const FILESYSTEM_RULES = `
## 用户附件与导出文件

用户上传的文件在对象存储中，并挂载为文件系统路径：
- 附件目录：/uploads
- 导出目录：/exports
- 路径形如 /uploads/{文件ID}--{文件名} 或 /exports/{文件ID}--{文件名}
- 用户消息中的 <attachments> 给出附件完整路径

处理附件时：
- 图片已经包含在用户消息中，直接根据图像回答。不要对图片调用 read_file。
- 阅读 txt、csv、docx、xlsx 时，先根据 <attachments> 或 ls 确认路径，再用 read_file。
- 不阅读 zip、rar、7z、tar、gz 等压缩包。遇到压缩包时说明无法直接阅读，请用户解压后上传其中的文档、表格或图片。
- 旧版 .doc / .xls 无法解析，请用户另存为 .docx / .xlsx。
- 工具返回错误时如实说明；不要在没有读到内容时声称已经阅读。
- 不要覆盖用户原件。填写模板或导出时：
  - 替换占位符、句子或单元格原文：对原路径使用 edit_file，结果会另存到 /exports
  - 按模板重写整份结果：用 write_file 写到 /exports/文件名.xlsx（内容为 CSV）、.docx、.csv 或 .txt
- 写入成功后的路径在 /exports。用文件名告诉用户可以下载，不要把路径或文件 ID 念给用户。
- 思考过程只说「阅读附件、按模板填写、生成可下载文件」，不要出现工具名。
`.trim()
