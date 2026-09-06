export type ApprovalAction = { name?: string; args?: unknown; description?: string }

export type ApprovalInterruptView = {
  id?: string
  actions: ApprovalAction[]
  toolName?: string
  args?: unknown
}

export function resolveApprovalInterrupt(
  interrupt: { id?: string; metadata?: Record<string, unknown> } | null | undefined,
  event?: { value?: unknown } | null
): ApprovalInterruptView {
  const fromInterrupt = fromUnknown(interrupt)
  const fromEvent = fromUnknown(parseJsonValue(event?.value))
  const actions = fromInterrupt.actions.length ? fromInterrupt.actions : fromEvent.actions
  return {
    id: fromInterrupt.id ?? fromEvent.id,
    actions,
    toolName: fromInterrupt.toolName ?? fromEvent.toolName,
    args: fromInterrupt.args ?? fromEvent.args
  }
}

export function approvalToInterruptView(approval: {
  interruptId: string
  toolName: string
  arguments: unknown
}): ApprovalInterruptView {
  return {
    id: approval.interruptId,
    toolName: approval.toolName,
    args: approval.arguments,
    actions: [{ name: approval.toolName, args: approval.arguments }]
  }
}

function fromUnknown(value: unknown): ApprovalInterruptView {
  const record = asRecord(value)
  if (!record) return { actions: [] }

  const metadata = asRecord(record.metadata)
  const payload = asRecord(parseJsonValue(metadata?.value ?? record.value)) ?? metadata ?? record
  const requests = Array.isArray(payload.actionRequests)
    ? payload.actionRequests
    : Array.isArray(record.actionRequests)
      ? record.actionRequests
      : []
  const actions = requests.filter(isApprovalAction)
  const first = actions[0]
  const toolName = readString(metadata?.toolName) ?? first?.name ?? readString(record.toolName)
  const id = readString(record.id)

  return {
    id,
    actions,
    toolName,
    args: first?.args ?? metadata?.args ?? record.args
  }
}

function isApprovalAction(value: unknown): value is ApprovalAction {
  return value !== null && typeof value === 'object'
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}
