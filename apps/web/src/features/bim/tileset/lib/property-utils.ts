function isEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length === 0
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0
}

/** 判断属性值是否有展示意义（过滤 schema 键名但无实际数据的空值） */
export function isMeaningfulPropertyValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (isEmptyString(value)) return false
  if (isEmptyArray(value)) return false
  return true
}

export function filterMeaningfulProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (isMeaningfulPropertyValue(value)) {
      result[key] = value
    }
  }
  return result
}

export function countMeaningfulProperties(properties: Record<string, unknown>): number {
  return Object.values(properties).filter(isMeaningfulPropertyValue).length
}
