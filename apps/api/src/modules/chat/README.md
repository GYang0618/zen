# Deprecated Chat Module

此目录保留历史 Chat Agent 实现，仅用于兼容现有模块聚合和迁移期间的引用。

正式 AI 链路为：

```text
Copilot Web → /copilot/* → CopilotRuntime → default_agent
```

请勿在此目录新增 Agent、Tool、审批、事件或 Web 交互能力。新的能力应进入 `apps/agent/src/default.ts`、`apps/api/src/modules/copilot` 或对应插件边界。
