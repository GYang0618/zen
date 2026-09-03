import { getToolTitle } from '@/components/ai/tool-display'

const TARGET_KEYS = new Set(['name', 'displayName', 'title', 'code', 'username', 'label'])

export function resolveApprovalOperation(toolNames: string[]): string {
  if (toolNames.length === 0) return '执行该操作'
  return toolNames.map(getToolTitle).join('、')
}

/** 从 Tool 参数里取出可展示的目标（名称、编码），忽略 cuid / uuid 等内部 ID。 */
export function extractReadableTargets(args: unknown): string[] {
  const found = new Set<string>()
  visit(args, found)
  return [...found]
}

function visit(value: unknown, found: Set<string>, key?: string): void {
  if (typeof value === 'string') {
    const text = value.trim()
    if (text && key && isTargetKey(key) && !isOpaqueId(text)) found.add(text)
    return
  }

  if (Array.isArray(value)) {
    const itemKey = key === 'codes' ? 'code' : key === 'names' ? 'name' : key
    for (const item of value) visit(item, found, itemKey)
    return
  }

  if (value !== null && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) {
      visit(child, found, childKey)
    }
  }
}

function isTargetKey(key: string): boolean {
  return TARGET_KEYS.has(key) || key === 'codes' || key === 'names'
}

function isOpaqueId(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
    /^c[a-z0-9]{20,}$/i.test(value)
  )
}
