/**
 * 官方 Postgres-backed LangGraph checkpointer / Store。
 * LangGraph CLI（`langgraphjs up --postgres-uri`）会自行注入 persistence，
 * 图工厂导出给 CLI 时不得再绑一份，避免双重 checkpoint。
 */

export function memoryNamespace(input: {
  tenantId: string
  userId: string
  scope: string
  threadId?: string
}): string[] {
  const namespace = ['tenant', input.tenantId, 'user', input.userId, 'scope', input.scope]
  return input.threadId ? [...namespace, 'thread', input.threadId] : namespace
}

export async function createPostgresPersistence(
  connectionString = process.env.LANGGRAPH_POSTGRES_URI
) {
  if (!connectionString) {
    throw new Error('LANGGRAPH_POSTGRES_URI is required for official Postgres persistence')
  }
  const { PostgresSaver } = await import('@langchain/langgraph-checkpoint-postgres')
  const { PostgresStore } = await import('@langchain/langgraph-checkpoint-postgres/store')
  const checkpointer = PostgresSaver.fromConnString(connectionString)
  await checkpointer.setup()
  const store = PostgresStore.fromConnString(connectionString)
  return { checkpointer, store }
}

export function isLangGraphServerRuntime(): boolean {
  return Boolean(
    process.env.LANGGRAPH_API ||
      process.env.LANGGRAPH_CLOUD ||
      process.argv.some((arg) => arg.includes('langgraph'))
  )
}
