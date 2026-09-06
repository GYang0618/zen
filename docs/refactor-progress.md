# 重构进度与验证记录

记录日期：2026-09-06。

对应目标：[全项目重构计划](./refactor.md)。本记录区分源码迁移完成项与仍需真实部署环境执行的验收项。

## 剩余任务收口（2026-09-06 20:40）

源码层未完成项本轮已补齐，并重新跑过对应验证：

- Agent：typed runtime context、写操作 fail-closed、per-run API client、capability tags、图工厂；接入官方 `@langchain/langgraph-checkpoint-postgres`（CLI 仍自行注入 persistence，图工厂不双重绑定）。`pnpm --filter agent test` 26/26 通过；`pnpm --filter agent check-types` 通过。
- API：Checkpoint/ToolLedger 独立 service、Health 探活 DB+Storage、并发配额、SSE 旁路 JSON 幂等、插件启动校验、graceful shutdown。`pnpm --filter api test` 33 套件 / 185 项通过；`pnpm --filter api check-types` 通过。
- DB：checkpoint `parentId`/`namespace`/`stateHash`、AgentThread Tenant/User FK、记忆容量配额；`node scripts/validate-agent-runtime-schema.mjs` 通过。
- Web：Router context、`loaderDeps`、组织页 Zod search、`FormActions`、插件配置 TanStack Form、Users/Roles/Posts 共用 `DataTable`。`pnpm --filter web test` 34 文件 / 184 项通过；`pnpm --filter web check-types` 与 `pnpm --filter @zen/ui check-types` 通过。修复 `@zen/ui` barrel 与 Base UI primitives 的同名导出冲突。
- CopilotKit HITL 前端保持 `useInterrupt`（v2 技能约定，不回退 `useHumanInTheLoop`）。Copilot 仍经 Nest 认证守卫后调用官方 Express adapter，并 `BypassTransform`，避免丢失 Auth 或把 SSE 包进 JSON 信封。

仍需真实环境验收（本轮未执行）：Docker/Postgres 跨进程 checkpoint 恢复、生产 CORS/限流/幂等竞争、浏览器端 Agent SSE/HITL 全链路。

## 本轮继续推进（2026-09-06）

- Agent 运行数据库字段已从裸字符串收紧为 Prisma enum：Thread、Run/Turn 状态、结束原因、审批状态/决策、风险等级、副作用、Tool 执行状态、Artifact 状态、Memory 敏感度和 API 幂等状态。
- 新增可重复执行的状态枚举迁移，按现有小写数据库值转换字段，保持 HTTP 返回兼容。
- 重新生成 Prisma Client；Prisma schema validate、API/Agent TypeScript build 和全仓库 error 级 Biome check 通过。
- Web Vite production build 通过；输出仍有既有大 chunk warning。期间修复了 Base UI 适配层与组件 barrel 的同名导出歧义。
- API Jest 全量回归通过：29 个套件、171 项测试；执行方式为 API 工作目录下的 ESM VM modules 入口。
- 已新增 Agent HITL 一次性授权表和完整绑定校验：tenant/user/run/tool/approval/nonce，数据库条件更新保证单次消费；恢复流程复用原 Run ID。
- Artifact、Memory、Metrics、Thread、Run、Event、Approval、Reconciliation 已抽为独立 Nest service；Store 保留为兼容 facade，仅负责跨领域运行编排。
- Copilot 路由已使用独立 `copilot` 限流桶，保留协议轮询保护，同时不消耗普通 JSON API 的限流额度；请求体大小也按路由单独配置。
- Postgres-backed LangGraph 已提供官方 CLI 启动入口和隔离 Compose 数据库，但尚未在本机真实启动 Docker/Postgres 完成跨进程恢复、租约接管和断线重连验收。

## 自动推进复核（2026-09-06 14:22）

- 网络与执行权限已恢复，代理已成功执行依赖安装及 frozen-lockfile 复核。
- 10 个原 react-hook-form 表单已迁移到 TanStack Form，使用 Zod 校验、字段订阅、服务端错误及 reset；修正岗位表单每次渲染生成随机编码的问题。新增登录和注册组件交互测试 2 项。
- Radix 图标已替换为 lucide-react；Reasoning 的受控/非受控状态改为 React 状态；UI 基础组件已通过内部适配层迁移到 Base UI。
- Shared 移除 AI SDK UIMessage 依赖；旧 Chat 专用输入暂时收回 API 模块，随阶段三删除。
- Agent 已删除 sdk-js import，使用 LangChain middleware 接收标准 `ag-ui` 工具与上下文；新增前端工具返回、混合调用恢复、禁止覆盖服务端工具 3 项测试。API 已使用 CopilotKit v2 Express adapter；Agent 图通过独立 LangGraph CLI 服务部署，API 侧保存 AG-UI 事件、运行账本、审批、Artifact、Memory 与恢复投影。
- nestjs-pino 升级到支持 Nest 12 的 5.1.0。throttler 最新版仍为 6.5.0，未声明 Nest 12 peer；当前 API 测试通过但仍须在安全运行控制阶段替换或验证限流接入。
- 插件生成器统一经过 Biome stdin 格式化，生成后 `plugin:check` 通过。修复权限扫描误识别本地存储 key、Agent middleware 路径过时的误报。
- 清理全部阻断 lint 的源代码格式与可访问性问题。排除运行数据和按 JSON 序列化生成的 OpenAPI 文档；lint 保持只读。
- 最新验证：`pnpm check-types` 17 个任务通过；`pnpm test` 共 397 项通过（Web 176、API 174、Agent 23、Shared 4、SDK 11、插件 9）；`pnpm build` 9 个任务通过；API e2e 2 项通过；插件生成一致性、RBAC、Default Agent 边界检查通过。
- 构建发现的 API prebuild 插件过滤器已改为显式插件包名，并在本轮完整构建中复核。
- 仍有上游 peer 警告（LangGraph CLI、Stagehand、React Three、throttler）和 Web 大 chunk，不能据此宣称全重构完成。

下方为历史记录。

## 阶段二复核与阶段三启动（2026-09-06）

- ESM 迁移后的 `pnpm check-types` 通过 17/17 个任务。
- 全量 `pnpm test` 通过 397 项（Web 176、API 174、Agent 23、Shared 7、Plugin SDK 11、插件 9）。
- `pnpm build` 通过 9 个任务；`pnpm plugin:check`、RBAC、Default Agent、插件守卫检查通过。
- `pnpm lint` 通过；插件动态模块保留 9 个非阻断 Biome warning（Nest 的静态 forRoot class 与 DI any 兼容签名）。
- Shared/Plugin SDK/Plugin Registry 的 NodeNext、`.js` 导入、package exports 和 ToolManifest 运行时契约已验证。
- 阶段三已开始：CopilotRuntime 改为 CopilotModule 生命周期单例，使用 v2 `agents` factory 注入请求级 token、认证上下文、线程/run；移除 AppModule 对旧 ChatModule 的生产挂载。
- API 回归测试在移除 ChatModule 后通过 29 个套件、174 项；OpenAPI 模块清单同步删除 ChatModule。
- Prisma Agent 运行模型已具备 thread、run、turn、message、event journal、checkpoint、approval、tool ledger、artifact、memory、evaluation 和 idempotency 表；`prisma validate` 通过，`prisma migrate status` 报告 33 个迁移全部已应用。
- 阶段三的旧 interrupt 事件兼容转换及旧 Chat 源码已清理；边界门禁已更新为确保旧 Chat 目录不存在。
- 阶段五的 TanStack Form 依赖清理与 Base UI 基础组件迁移已完成；组件映射报告位于 `packages/ui/.migration/`。

## 手动执行后的复核

- 用户已成功从 `main` 创建 `codex/zen-platform-rewrite`，当前工作区分支已核实。
- 用户执行 `pnpm install --no-frozen-lockfile` 成功，根 lockfile 已更新。实际安装的 NestJS Common/Core 为 12.0.1，Config 为 12.0.0。
- 用户提供的终端日志显示 `pnpm --filter api test:e2e` 的两个测试均通过；这项结果来自用户在系统终端执行，不是代理沙箱内重跑。
- 使用已缓存 pnpm 11.7.0 执行离线 `--lockfile-only --frozen-lockfile --ignore-scripts` 检查通过；该检查只验证锁文件解析，不代表完整依赖重新安装。
- 新依赖暴露了 Nest 12 的异步模块配置类型差异，已补齐 Throttler 的 `imports` 及 Logger 的 `imports`、`providers`。
- UserService 的工具函数改为直接导入，避免经 common 聚合入口加载全局模块和日志模块；新依赖下 API 类型检查、29 个单元测试套件全部通过（174 个测试）。
- Web 类型检查目前失败：源代码仍使用已经从 package.json 移除的 `react-hook-form`、`@hookform/resolvers`、Radix icons；Shared 的 `UIMessage` 仍引用 `ai`，UI reasoning 仍引用已移除的 Radix 状态 hook。
- Agent 类型检查目前失败：`default.ts` 和 `plan.ts` 仍引用已移除的 `@copilotkit/sdk-js/langgraph`。这些源代码须随迁移一起处理。
- `pnpm peers check` 发现 `@nestjs/throttler@6.5.0` 和 `nestjs-pino@4.6.1` 未声明支持 Nest 12，另有 LangGraph CLI、Stagehand、React Three 相关 peer 冲突。安装成功不能视为这些兼容性问题已解决。

下面的结果表保留首次安装前的历史基线，以本节复核结果为当前状态。

## 初始基线与工作区

- 开始时 `main` 和 `HEAD` 均为 `be0672beb61c24db6ac129f0903eca60c694196f`。
- 初始分支为 `codex/full-stack-rewrite`。当时创建 `codex/zen-platform-rewrite` 被文件系统权限拦截，现已由用户手动完成。
- 开始时已有十个受版本控制文件的未提交修改，以及重构文档和 Shared Agent 契约。这些内容被保留，并在其上继续修复。
- 以下结果来自现有安装依赖的工作区，不是重新安装后的干净 `main` 基线，也不代表 NestJS 12 的兼容性已经验证。
- 实际验证环境：Node 24.14.1、`tsc` 7.0.2、NestJS Common 11.1.28、Biome 2.5.5、Vitest 4.1.10。TypeScript JS API 仍由别名包转发至 6.0.3。

## 已落地

- 所有工作区 `lint` 脚本改为只读 `biome check`。格式化仍是独立的主动写入操作。
- 补齐 Agent 的 `lint`、`check-types`；Request 增加标准 `check-types` 入口。
- Web 使用 `tsc -b --noEmit` 检查应用和构建配置，避免只检查空的项目引用入口。
- Turbo 的类型检查显式依赖上游构建，满足 Shared、SDK 和插件的声明产物依赖。
- 删除 Web 下重复的 pnpm lockfile，根 lockfile 作为唯一依赖锁文件，现已由用户安装命令成功更新。
- Node 最低版本与当前 24.14.1 工具链对齐。
- Biome 排除构建、缓存、覆盖率及 Agent 生成客户端；修复 Agent 子配置覆盖根忽略规则的问题。
- API 的源码及测试导入迁移为 `.js` 相对路径，删除 TypeScript 的 `@/` 路径映射，生产入口明确为 `dist/main.js`。
- API 使用 `.mjs` Jest 配置、ESM transform 和 VM modules；测试通过 `import.meta.jest` 访问 mock API，并移除 `__dirname` 用法。
- API 移除 `ts-node`、`tsconfig-paths` 直接依赖和相关调试启动方式。Jest 不再强制退出，关闭 Watchman 外部服务依赖。
- Agent 测试使用 `node --import tsx --test`，引号保护 glob，避免依赖 shell 展开和 tsx CLI IPC。
- Shared Agent 上下文的 memory 默认值由 `default({})` 改为 `prefault({})`，确保执行嵌套字段默认值，并增加四个回归测试。
- Agent 的导航工具及菜单删除不存在的 `/chat-v2` 入口，修复完整 Web 类型检查发现的问题。

## 初次安装前验证结果

| 工作区 | 类型检查 | 构建步骤 | 测试 | 只读 lint |
| --- | --- | --- | --- | --- |
| Web | 通过 | TypeScript + Vite 通过 | 174 通过 | 19 个存量错误 |
| API | 通过 | Nest build 通过 | 174 通过 | 6 个存量错误 |
| Agent | 通过 | TypeScript 通过 | 20 通过 | 通过 |
| UI | 通过 | 无独立 build 脚本，由 Web 消费 | 无独立测试脚本 | 37 个存量错误 |
| Shared | 通过 | TypeScript 通过 | 4 个新增契约测试通过 | 通过 |
| Plugin SDK | 通过 | TypeScript 通过 | 11 通过 | 4 个存量错误 |
| Plugin Registry | 通过 | TypeScript noEmit 通过 | 无独立测试脚本 | 6 个存量错误 |
| Request | 通过 | 无独立 build 脚本，由 Web 消费 | 无独立测试脚本 | 通过 |
| demo-notes | 通过 | TypeScript 通过 | 3 通过 | 2 个存量错误 |
| jobs | 通过 | TypeScript 通过 | 3 通过 | 2 个存量错误 |
| notifications | 通过 | TypeScript 通过 | 3 通过 | 2 个存量错误 |

测试总计：392 个通过。API 在修复前的 29 个套件均因 ESM 配置不匹配无法执行。

构建验证直接调用本地已安装的编译器和打包器。API 使用已有 Prisma 客户端，Agent 使用已有 OpenAPI 客户端；尚未验证从空产物开始的完整 pnpm prebuild/install 链路。

额外检查：

- API 编译后的 `app.module.js` 可由 Node 原生 ESM 导入。
- API `dist/**/*.js` 未检出 `require()`、`module.exports` 或 `exports.`。
- 文档链接、写接口权限装饰器、插件守卫扫描通过。
- HTTP e2e 配置能够加载和初始化 Nest 测试应用，但两个 HTTP 测试因 `listen EPERM` 无法监听本地端口。
- Web 构建仍有大于 500 kB 的 chunk 警告。
- Shared 的源文件契约测试会报告包尚未显式声明 ESM 的警告；Shared 包整体 ESM 迁移尚未完成。

常规复核命令（需要先恢复 pnpm 和依赖安装环境）：

```sh
pnpm install --frozen-lockfile
pnpm check-types
pnpm test
pnpm build
pnpm lint
pnpm -F api test:e2e
pnpm plugin:check
pnpm check:rbac
pnpm check:default-agent
```

## 历史遗留事项（已处理）

1. Web、Agent、API 的新依赖与 ESM 类型/测试运行时已修复并通过检查。
2. TypeScript、测试运行器、只读 lint 与构建脚本已统一；根 lockfile 已更新。
3. 生成器格式化、插件注册表漂移和静态门禁误报已修复。
4. 旧 Chat、旧 interrupt 字段、Radix 依赖和 `/chat-v2` 残留已清理。

初始依赖阻塞已由用户安装解除。代理沙箱内 npm registry DNS 仍解析失败，后续新增依赖如需下载，可能仍须用户在系统终端安装。

## 当前仍需部署环境验证或后续实现的事项

- 真实 Postgres 环境下的跨进程 LangGraph checkpoint 恢复、租约接管和断线重连。
- 生产配置下的 CORS、限流、step-up、幂等竞争、取消/超时及孤儿 Run 对账。
- 真实浏览器中的 Base UI 键盘/焦点行为、Router 守卫，以及 Agent SSE/HITL 全链路回归。
- 已提供官方 Postgres-backed Agent CLI 启动入口；仍需在真实 Docker/Postgres 环境完成跨进程恢复、租约接管和断线重连验收。
- 生产 Docker/Postgres、真实浏览器和生产安全运行验收仍需在对应环境执行；源码层启动门禁、Copilot 独立限流和 Store service 边界已补齐。

以上事项均属于真实 Docker/Postgres、生产配置或浏览器环境验收；源码层对应的启动门禁、限流、请求体大小、Store 拆分和运行控制已完成。
