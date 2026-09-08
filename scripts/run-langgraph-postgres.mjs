import { spawn } from 'node:child_process'

const uri = process.env.LANGGRAPH_POSTGRES_URI?.trim()
if (!uri) {
  console.error('LANGGRAPH_POSTGRES_URI is required for the Postgres-backed LangGraph service')
  process.exit(1)
}

const cli = process.platform === 'win32' ? 'langgraphjs.cmd' : 'langgraphjs'
const child = spawn(cli, ['up', '--config', 'langgraph.json', '--postgres-uri', uri, '--wait'], {
  cwd: new URL('../apps/agent/', import.meta.url),
  stdio: 'inherit',
  shell: false
})

const forwardSignal = (signal) => child.kill(signal)
process.once('SIGINT', () => forwardSignal('SIGINT'))
process.once('SIGTERM', () => forwardSignal('SIGTERM'))
child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
