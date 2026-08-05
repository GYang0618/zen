# @zen/ui 文档

`@zen/ui` 分两块源码，职责不要混用：

| 目录 | 用途 | 来源 |
|------|------|------|
| [`src/components/`](../src/components/) | shadcn / registry 组件 | CLI / 官方 registry |
| [`src/common/`](../src/common/) | 自研通用组件 | 本仓库手写 |

## 阅读入口

- [自研通用组件（common）](./common/README.md)

## 约定

- 业务侧优先：`import { … } from '@zen/ui'`
- 深路径可选：`@zen/ui/components/button`
- 新自研组件放 `src/common/`，并在 `docs/common/` 补说明
- 细分槽位较多的复合组件：文档必须**从简单到复杂**给出多组示例
