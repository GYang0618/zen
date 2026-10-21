/**
 * 本地 Docker 部署。请用 `pnpm run deploy`，`pnpm deploy` 是 pnpm 内置命令。
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RUNTIME_COMPOSE = join(ROOT, 'docker/compose.runtime.yml')
const COMPOSE_PROJECT = 'zen'
const APP_SERVICES = ['api', 'agent', 'web']
const AGENT_SECRET_KEYS = ['OPENAI_API_KEY', 'LANGSMITH_API_KEY']
const SECRET_FALLBACK_KEYS = ['JWT_SECRET', 'AGENT_INTERNAL_TOKEN']
const OPTIONAL_KEYS = ['JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN', 'LOG_LEVEL']
const AI_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'LANGSMITH_API_KEY',
  'LANGSMITH_ENDPOINT',
  'LANGSMITH_TRACING',
  'LANGSMITH_PROJECT'
]
const INFRA_BY_APP = {
  api: ['zen-postgres', 'zen-minio'],
  agent: ['zen-langgraph-postgres'],
  web: []
}

function printHelp() {
  console.log(`用法:
  pnpm run deploy
  pnpm run deploy api
  pnpm run deploy agent
  pnpm run deploy web
  pnpm run deploy api web

在本地 Docker 中构建并更新服务，容器归在项目 zen 下。
不带参数时更新 api、agent、web。再次执行会重新构建镜像并重建所选容器，数据卷保留。
请使用 pnpm run deploy。pnpm deploy 是 pnpm 自己的命令。`)
}

function parseTargets(argv) {
  const args = argv.filter((arg) => arg !== '--')
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return null
  }

  const unknown = args.filter((arg) => !APP_SERVICES.includes(arg))
  if (unknown.length > 0) {
    throw new Error(`未知服务: ${unknown.join(', ')}。可选: ${APP_SERVICES.join(', ')}`)
  }

  const selected = new Set(args)
  if (selected.size === 0) return [...APP_SERVICES]
  return APP_SERVICES.filter((service) => selected.has(service))
}

function parseEnv(text) {
  const result = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const body = trimmed.startsWith('export ') ? trimmed.slice('export '.length) : trimmed
    const separator = body.indexOf('=')
    if (separator <= 0) continue
    const key = body.slice(0, separator).trim()
    let value = body.slice(separator + 1).trim()
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    if (quoted) value = value.slice(1, -1)
    result[key] = value
  }
  return result
}

async function readEnvFile(path) {
  if (!existsSync(path)) return {}
  return parseEnv(await readFile(path, 'utf8'))
}

function firstNonEmpty(...values) {
  return values.find((value) => value?.trim())?.trim() ?? ''
}

function readKey(key, ...sources) {
  return firstNonEmpty(process.env[key], ...sources.map((source) => source[key]))
}

function pickKeys(keys, ...sources) {
  const result = {}
  for (const key of keys) {
    const value = readKey(key, ...sources)
    if (value) result[key] = value
  }
  return result
}

async function loadSources() {
  const [apiEnv, agentEnv, apiExample, webExample] = await Promise.all([
    readEnvFile(join(ROOT, 'apps/api/.env')),
    readEnvFile(join(ROOT, 'apps/agent/.env')),
    readEnvFile(join(ROOT, 'apps/api/.env.example')),
    readEnvFile(join(ROOT, 'apps/web/.env.example'))
  ])
  return { apiEnv, agentEnv, apiExample, webExample }
}

function buildRuntimeEnv({ apiEnv, agentEnv, apiExample }) {
  return {
    ...pickKeys(SECRET_FALLBACK_KEYS, apiEnv, agentEnv, apiExample),
    ...pickKeys(OPTIONAL_KEYS, apiEnv, agentEnv),
    ...pickKeys(AI_KEYS, agentEnv, apiEnv)
  }
}

function applyWebBuildEnv(webExample) {
  for (const key of ['VITE_APP_NAME', 'VITE_APP_API_TIMEOUT']) {
    if (!process.env[key]?.trim() && webExample[key]?.trim()) {
      process.env[key] = webExample[key].trim()
    }
  }
}

function assertDeployable(targets, runtimeEnv) {
  if (targets.includes('api')) {
    const missing = SECRET_FALLBACK_KEYS.filter((key) => !runtimeEnv[key])
    if (missing.length > 0) {
      throw new Error(
        `部署 api 缺少 ${missing.join(', ')}。请写入 apps/api/.env 或 apps/api/.env.example。`
      )
    }
  }

  if (!targets.includes('agent')) return

  const swaggerPath = join(ROOT, 'apps/api/swagger.json')
  if (!existsSync(swaggerPath)) {
    throw new Error(
      '缺少 apps/api/swagger.json。请先在本地启动一次 API，生成 OpenAPI 后再部署 agent。'
    )
  }

  const missingSecrets = AGENT_SECRET_KEYS.filter((key) => !runtimeEnv[key])
  if (missingSecrets.length > 0) {
    throw new Error(`部署 agent 需要 ${missingSecrets.join(', ')}。请写入 apps/agent/.env。`)
  }
}

function renderEnvironment(runtimeEnv) {
  const entries = Object.entries(runtimeEnv)
  if (entries.length === 0) return ['    environment: {}']
  const lines = entries.map(([key, value]) => `      ${key}: ${JSON.stringify(value)}`)
  return ['    environment:', ...lines]
}

async function writeRuntimeCompose(runtimeEnv) {
  const environment = renderEnvironment(runtimeEnv)
  const body = ['services:', '  api:', ...environment, '  agent:', ...environment, ''].join('\n')
  await writeFile(RUNTIME_COMPOSE, body, { mode: 0o600 })
}

function composeArgs(args) {
  return [
    'compose',
    '-f',
    'docker-compose.yml',
    '-f',
    'docker/compose.runtime.yml',
    '-p',
    COMPOSE_PROJECT,
    ...args
  ]
}

function run(command, args, stdio = 'inherit') {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, env: process.env, stdio })
    child.once('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error('未找到 docker 命令'))
        return
      }
      reject(error)
    })
    child.once('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(Object.assign(new Error(`${command} 退出码 ${code ?? 1}`), { exitCode: code ?? 1 }))
    })
  })
}

async function assertDocker() {
  try {
    await run('docker', ['info'], 'ignore')
  } catch (error) {
    if (error.exitCode) throw new Error('Docker 未运行或未安装。')
    throw error
  }

  try {
    await run('docker', ['compose', 'version'], 'ignore')
  } catch (error) {
    if (error.exitCode) throw new Error('未检测到 Docker Compose。')
    throw error
  }
}

async function deploy(targets) {
  const infra = [...new Set(targets.flatMap((target) => INFRA_BY_APP[target]))]
  if (infra.length > 0) {
    await run('docker', composeArgs(['up', '-d', '--wait', ...infra]))
  }

  const updateArgs = ['up', '-d', '--build', '--force-recreate', '--no-deps', '--wait']
  if (targets.length === APP_SERVICES.length) updateArgs.push('--remove-orphans')
  await run('docker', composeArgs([...updateArgs, ...targets]))
  await run('docker', composeArgs(['ps', ...targets]))
}

async function main() {
  const targets = parseTargets(process.argv.slice(2))
  if (!targets) return

  const sources = await loadSources()
  if (targets.includes('web')) applyWebBuildEnv(sources.webExample)
  const runtimeEnv = buildRuntimeEnv(sources)
  assertDeployable(targets, runtimeEnv)
  await writeRuntimeCompose(runtimeEnv)
  await assertDocker()
  await deploy(targets)
  console.log(`Docker 项目 ${COMPOSE_PROJECT} 已更新: ${targets.join(', ')}`)
}

main().catch((error) => {
  if (!error.exitCode) console.error(error.message)
  process.exit(error.exitCode ?? 1)
})
