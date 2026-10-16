/**
 * 流式事件会先写下 assistant / tool，用户消息往往要等检查点快照才出现，
 * 于是被追加到列表末尾。把第一条 user 之前被挤到前面的模型输出移回末尾。
 * 已经以 user（或仅有 system）开头的列表保持原样。
 */
export function restoreDisplacedTurnPrefix<T extends { role: string }>(messages: T[]): T[] {
  const firstUserIndex = messages.findIndex((message) => message.role === 'user')
  if (firstUserIndex <= 0) return messages

  const prefix = messages.slice(0, firstUserIndex)
  const displaced = prefix.filter((message) => message.role !== 'system')
  const hasModelOutput = displaced.some(
    (message) => message.role === 'assistant' || message.role === 'tool'
  )
  if (!hasModelOutput) return messages

  const keptPrefix = prefix.filter((message) => message.role === 'system')
  return [...keptPrefix, ...messages.slice(firstUserIndex), ...displaced]
}
