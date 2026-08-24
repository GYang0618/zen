# Zen 平台文档

> 状态：设计基线已冻结（2026-07）  
> 目标：打造优秀的**平台基础 + 插件系统**，支撑现代化后台管理与业务扩展

本文档集定义 Zen 的产品边界、架构原则与分阶段实施计划。实现以当前技术栈（React / NestJS / Prisma / Turborepo）为落地基础，但**不受现有业务模块约束**——现有模块将按本设计重构。

---

## 设计基线（不可轻易变更）

| 决策 | 结论 | ADR |
|------|------|-----|
| 插件运行模型 | 第一方**编译期插件**优先，预留运行时扩展 | [ADR-001](./adr/001-plugin-runtime-model.md) |
| 租户模型 | 单租户交付，全链路 **tenantId 就绪** | [ADR-002](./adr/002-tenant-readiness.md) |
| 架构形态 | 模块化单体 + Turborepo monorepo | [平台总览](./architecture/platform-overview.md) |
| 核心 vs 业务 | 内核只承载不可替代能力；业务一律插件化 | [插件系统](./architecture/plugin-system.md) |
| 文件与对象存储 | 上传/对象存储归内核；管理页为系统模块 | [ADR-003](./adr/003-file-storage-kernel.md) |

---

## 阅读顺序

1. **[功能清单](./product/feature-catalog.md)** — 平台要具备什么
2. **[平台总览](./architecture/platform-overview.md)** — 系统如何分层与部署
3. **[领域与安全](./architecture/domain-and-security.md)** — 身份、组织、RBAC、DataScope
4. **[插件系统](./architecture/plugin-system.md)** — Manifest、生命周期、贡献点
5. **[契约与事件](./architecture/contracts-and-events.md)** — OpenAPI、权限码、事件总线
6. **[仓库结构](./architecture/repository-structure.md)** — monorepo 目录与包边界
7. **[实施路线](./implementation/roadmap.md)** — 分阶段交付与验收
8. **[参考插件](./implementation/plugin-reference.md)** — 端到端最小插件模板

---

## 文档索引

### 产品

| 文档 | 说明 |
|------|------|
| [feature-catalog.md](./product/feature-catalog.md) | P0/P1/P2 功能清单，含归属与阶段映射 |

### 架构

| 文档 | 说明 |
|------|------|
| [platform-overview.md](./architecture/platform-overview.md) | 运行时拓扑、模块边界、依赖方向 |
| [domain-and-security.md](./architecture/domain-and-security.md) | 领域模型、认证授权、审计 |
| [plugin-system.md](./architecture/plugin-system.md) | 插件契约、生命周期、贡献点 |
| [contracts-and-events.md](./architecture/contracts-and-events.md) | 契约策略、事件、可观测 |
| [repository-structure.md](./architecture/repository-structure.md) | 目标仓库结构与构建边界 |

### 实施

| 文档 | 说明 |
|------|------|
| [roadmap.md](./implementation/roadmap.md) | Phase 0–5 实施计划与 Definition of Done |
| [plugin-reference.md](./implementation/plugin-reference.md) | 首个参考插件设计 |

### 指南

| 文档 | 说明 |
|------|------|
| [openapi-and-codegen.md](./guides/openapi-and-codegen.md) | OpenAPI 全量覆盖与 Agent codegen |

### 迁移

| 文档 | 说明 |
|------|------|
| [department-deprecation.md](./migration/department-deprecation.md) | Department 双树废弃与合并计划 |

### 决策记录（ADR）

| 文档 | 说明 |
|------|------|
| [001-plugin-runtime-model.md](./adr/001-plugin-runtime-model.md) | 编译期插件优先 |
| [002-tenant-readiness.md](./adr/002-tenant-readiness.md) | 单租户交付 + tenantId 就绪 |
| [003-file-storage-kernel.md](./adr/003-file-storage-kernel.md) | 文件与对象存储归内核 |

---

## 术语表

| 术语 | 定义 |
|------|------|
| **Platform Kernel（平台内核）** | 身份、授权、组织、配置、审计、插件运行时等不可替代能力集合 |
| **Web Shell** | 前端壳层：布局、路由聚合、菜单渲染、权限守卫、插件贡献点宿主 |
| **API Kernel** | 后端壳层：NestJS 宿主、全局 Guard/Filter、插件 Module 聚合 |
| **Agent Runtime** | LangGraph / Copilot 运行时，承载 AI 工具与图的扩展 |
| **Plugin（插件）** | 通过 Manifest 声明贡献点、随平台编译发布的第一方功能包 |
| **Contribution（贡献点）** | 插件向平台注册的扩展面：路由、菜单、API、权限、事件、任务、Agent Tool 等 |
| **Manifest** | 插件元数据与贡献点声明（`zen.plugin.json` 或 `package.json#zen`） |
| **Tenant Context** | 请求级租户上下文；第一阶段固定默认租户，字段与约束全链路就绪 |
| **DataScope** | 角色数据范围：全部 / 本组织及下级 / 本组织 / 仅本人 / 自定义 |
| **Permission Code** | 功能权限编码，格式 `{domain}:{resource}:{action}` |
| **Compile-time Plugin** | 与平台同仓同版本构建的插件，非运行时热插拔 |
| **Plugin SDK** | `@zen/plugin-sdk`：Manifest 类型、注册表、生命周期接口 |

---

## 维护约定

- 架构名词、权限码、插件状态、生命周期以本文档集为**唯一真相**；代码注释与 README 只链接，不复制全文。
- 变更设计基线须新增或修订 ADR，并同步更新功能清单与 roadmap 映射。
- 文档使用简体中文；代码标识符、权限码、事件名保持英文。
