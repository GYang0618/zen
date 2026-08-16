import { AsyncLocalStorage } from 'node:async_hooks'

export type RequestAuditContext = {
  actorId?: string
  tenantId?: string
  ip?: string
  userAgent?: string
  traceId?: string
}

const storage = new AsyncLocalStorage<RequestAuditContext>()

/**
 * 在请求入口包裹整个生命周期。
 * 必须用 run 而非 enterWith：守卫是被 await 调用的，enterWith 设置的上下文在返回调用方后即失效。
 */
export function runWithRequestAuditContext<T>(callback: () => T): T {
  return storage.run({}, callback)
}

/** 守卫解析出登录态后回填操作者信息（直接修改 store 引用，后续读取可见） */
export function setRequestAuditContext(patch: RequestAuditContext): void {
  const store = storage.getStore()
  if (!store) return
  Object.assign(store, patch)
}

export function getRequestAuditContext(): RequestAuditContext | undefined {
  return storage.getStore()
}
