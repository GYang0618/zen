#!/usr/bin/env node
/**
 * Default Agent 基线门禁：验证默认 Chat、Popup、Agent Tool 和废弃 Chat 模块边界。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const failures = []
const expectIncludes = (relativePath, fragment, description) => {
  if (!read(relativePath).includes(fragment)) {
    failures.push(`${description}（${relativePath} 缺少 ${fragment}）`)
  }
}

const expectExcludes = (relativePath, fragment, description) => {
  if (read(relativePath).includes(fragment)) {
    failures.push(`${description}（${relativePath} 不应包含 ${fragment}）`)
  }
}

expectIncludes(
  'apps/web/src/features/ai/copilot/popup.tsx',
  'agentId="plan"',
  'Popup 必须保持 plan Agent'
)
expectExcludes(
  'apps/web/src/features/ai/copilot/chat.tsx',
  'agentId="plan"',
  '默认 Chat 不得显式绑定 plan Agent'
)
expectIncludes(
  'apps/agent/src/default.ts',
  'tools: defaultAgentTools',
  'default_agent 必须通过正式 Registry 注册 Tool'
)
expectIncludes(
  'apps/agent/src/default.ts',
  'toolErrorMiddleware',
  'default_agent 必须注册 Tool 错误 Middleware'
)
expectIncludes(
  'apps/agent/src/default.ts',
  'copilotkitMiddleware',
  'default_agent 必须注册 CopilotKit Middleware'
)
expectIncludes(
  'apps/agent/src/default.ts',
  'maxOutputTokensPerModelCall',
  'default_agent 必须限制单次模型输出 Token'
)
expectIncludes(
  'apps/api/src/modules/copilot/agents.ts',
  'recursion_limit: DEFAULT_AGENT_RUN_BUDGET.recursionLimit',
  'default_agent 必须限制 LangGraph 递归次数'
)
expectExcludes(
  'apps/api/src/modules/copilot/langgraph-runtime-agent.ts',
  "onDisconnect: 'cancel'",
  'default_agent 不得将浏览器断连视为用户取消'
)
expectIncludes(
  'apps/api/src/modules/copilot/langgraph-runtime-agent.ts',
  '断线后继续持久化',
  'default_agent 必须在客户端断开后继续排空运行事件'
)
expectIncludes(
  'apps/api/src/modules/copilot/langgraph-runtime-agent.ts',
  'DEFAULT_AGENT_RUN_BUDGET.timeoutMs',
  'default_agent 必须设置 Run 超时'
)
expectIncludes(
  'apps/api/src/modules/copilot/langgraph-runtime-agent.ts',
  "new Set(['reasoning', 'activity'])",
  'Copilot Runtime 必须过滤 reasoning/activity'
)
expectIncludes(
  'apps/api/src/modules/chat/chat.module.ts',
  '@deprecated',
  '废弃 ChatModule 必须有 deprecated 标记'
)
expectIncludes(
  'apps/agent/src/default.ts',
  'humanInTheLoopMiddleware',
  '高风险 Tool 必须经过 LangGraph 审批中断'
)
expectIncludes('apps/agent/src/default.ts', 'summarizationMiddleware', '长对话必须启用上下文压缩')
expectIncludes(
  'apps/agent/src/api/call-api.ts',
  'policy?.retryPolicy',
  '只读 Tool 必须按 descriptor 执行有限重试'
)
expectIncludes(
  'apps/agent/src/tool-policy.ts',
  'retryableReasons',
  'Tool descriptor 必须声明可重试错误'
)
expectIncludes(
  'apps/agent/src/tools/registry.ts',
  'PLUGIN_AGENT_TOOL_FACTORIES',
  '插件 Tool 必须从生成注册表装载'
)
expectIncludes(
  'apps/agent/src/default.ts',
  'pluginToolVisibilityMiddleware',
  '非 ACTIVE 插件 Tool 必须从模型请求中移除'
)
expectIncludes(
  'apps/api/src/modules/copilot/copilot.service.ts',
  'listActiveIds',
  'API 必须传递租户 ACTIVE 插件'
)
expectIncludes(
  'apps/agent/src/api/index.ts',
  'x-agent-idempotency-key',
  'Agent Tool 必须向 API 传递幂等键'
)
expectIncludes(
  'apps/api/src/common/interceptors/agent-idempotency.interceptor.ts',
  'tenantId_userId_key',
  'API 幂等缓存必须按租户和用户隔离'
)
expectIncludes(
  'apps/api/src/modules/copilot/default-agent-runtime.store.ts',
  'agentEvent.create',
  'Default Agent 必须持久化可重放事件'
)
expectIncludes(
  'apps/api/src/modules/copilot/default-agent-runtime.utils.ts',
  'MODEL_MESSAGE_ROLES',
  'Checkpoint 必须过滤仅展示消息'
)
expectIncludes(
  'apps/api/src/modules/copilot/default-agent-runtime.store.ts',
  'normalizeRuntimeMessages',
  'Runtime Store 必须通过消息白名单规范化 Checkpoint'
)
expectIncludes(
  'apps/web/src/features/ai/copilot/components/chat-approval.tsx',
  'useInterrupt',
  'Default Chat 必须注册 LangGraph interrupt 审批 UI'
)
expectIncludes(
  'apps/web/src/features/ai/copilot/runtime-api.ts',
  'prepareRunResume',
  'Default Chat 必须提供 Run 恢复 API'
)
expectIncludes(
  'apps/web/src/features/ai/copilot/components/chat-runs.tsx',
  'onResume',
  'Default Chat 必须提供 Run 恢复和历史界面'
)

const toolFiles = ['user.ts', 'role.ts', 'organization.ts', 'post.ts']
const toolArrayNames = {
  'user.ts': 'userTools',
  'role.ts': 'roleTools',
  'organization.ts': 'organizationTools',
  'post.ts': 'postTools'
}

for (const file of toolFiles) {
  const relativePath = `apps/agent/src/tools/${file}`
  const source = read(relativePath)
  if (!source.includes("from '../api'")) {
    failures.push(`${relativePath} 必须通过 ../api 调用 API SDK`)
  }
  if (!source.includes('executeApiCall')) {
    failures.push(`${relativePath} 必须使用 executeApiCall 统一结果处理`)
  }
  if (/@\/modules\/|repository/i.test(source)) {
    failures.push(`${relativePath} 不得直连 Repository 或 API Module 内部实现`)
  }

  const declaredTools = [...source.matchAll(/export const (\w+Tool) = tool\(/g)].map(
    ([, name]) => name
  )
  const arrayName = toolArrayNames[file]
  const arrayMatch = source.match(
    new RegExp(`export const ${arrayName} = \\[([\\s\\S]*?)\\] as const`)
  )
  const arrayBody = arrayMatch?.[1] ?? ''
  for (const name of declaredTools) {
    if (!new RegExp(`\\b${name}\\b`).test(arrayBody)) {
      failures.push(`${relativePath} 声明的 ${name} 未加入 ${arrayName}`)
    }
  }
}

const toolRegistry = read('apps/agent/src/tools/index.ts')
for (const name of ['userTools', 'roleTools', 'organizationTools', 'postTools']) {
  if (!new RegExp(`\\b${name}\\b`).test(toolRegistry)) {
    failures.push(`apps/agent/src/tools/index.ts 未聚合 ${name}`)
  }
}

const allowedChatReferences = new Set([
  'apps/api/src/app.module.ts',
  'apps/api/src/modules/index.ts',
  'apps/api/src/swagger/openapi-modules.ts'
])

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'coverage'].includes(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath, files)
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath)
  }
  return files
}

for (const file of walk(path.join(root, 'apps'))) {
  const relativePath = path.relative(root, file)
  if (relativePath.startsWith('apps/api/src/modules/chat/')) continue
  if (allowedChatReferences.has(relativePath)) continue
  const source = fs.readFileSync(file, 'utf8')
  if (/modules\/chat|modules\\chat/.test(source)) {
    failures.push(`${relativePath} 不得新增引用废弃 Chat 模块内部实现`)
  }
}

if (failures.length > 0) {
  console.error('❌ Default Agent boundary check failed:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('✅ Default Agent boundary check passed')
