type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined
}

function parseRecord(raw: string): JsonRecord | undefined {
  try {
    return asRecord(JSON.parse(raw))
  } catch {
    return undefined
  }
}

/** 列表 Tool 只保留模型后续调用所需的标识字段，避免把详情 JSON 打进上下文。 */
export function compactPagedToolResult(
  raw: string,
  compactItem: (item: JsonRecord) => JsonRecord
): string {
  const parsed = parseRecord(raw)
  if (parsed?.success !== true) return raw
  const data = asRecord(parsed.data)
  if (!data || !Array.isArray(data.items)) return raw

  return JSON.stringify({
    ...parsed,
    data: {
      ...data,
      items: data.items.map((item) => {
        const record = asRecord(item)
        return record ? compactItem(record) : item
      })
    }
  })
}

export function compactUserListItem(user: JsonRecord): JsonRecord {
  const roles = Array.isArray(user.roles)
    ? user.roles.flatMap((role) => {
        const record = asRecord(role)
        return record
          ? [{ id: record.id, code: record.code, name: record.name, status: record.status }]
          : []
      })
    : undefined

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    nickname: user.nickname,
    realName: user.realName,
    status: user.status,
    ...(user.lastActiveAt === undefined ? {} : { lastActiveAt: user.lastActiveAt }),
    ...(roles ? { roles } : {})
  }
}

export function compactRoleListItem(role: JsonRecord): JsonRecord {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    status: role.status,
    effectiveStatus: role.effectiveStatus,
    kind: role.kind,
    dataScope: role.dataScope
  }
}
