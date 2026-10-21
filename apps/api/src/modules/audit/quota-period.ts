import { AiQuotaPeriod } from '@prisma/client'

/** 配额统计与拦截共用的 UTC 日界 / 月界，避免仪表盘用量和实际拦截窗口不一致。 */
export function quotaPeriodStart(period: AiQuotaPeriod, now = new Date()): Date {
  if (period === AiQuotaPeriod.DAY) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}
