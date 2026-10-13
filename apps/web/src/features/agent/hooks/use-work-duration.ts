'use client'

import { useEffect, useState } from 'react'

const TICK_MS = 1000

interface WorkDurationEntry {
  startedAt: number
  endedAt?: number
}

const durations = new Map<string, WorkDurationEntry>()

function readSeconds(entry: WorkDurationEntry | undefined, now: number): number | undefined {
  if (!entry) return undefined
  const end = entry.endedAt ?? now
  const seconds = Math.floor((end - entry.startedAt) / TICK_MS)
  if (entry.endedAt !== undefined) return Math.max(1, seconds)
  return Math.max(0, seconds)
}

/**
 * 按回合跟踪工作时长：进行中每秒刷新，结束后冻结。
 * 同一页面里切走再回来用内存记录；刷新后用持久化的事件时间。
 */
export function useWorkDuration(
  turnKey: string,
  isWorking: boolean,
  persisted?: WorkDurationEntry
): number | undefined {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!turnKey) return

    if (isWorking) {
      const existing = durations.get(turnKey)
      if (!existing || existing.endedAt !== undefined) {
        durations.set(turnKey, { startedAt: Date.now() })
      }
      setNow(Date.now())
      const timer = window.setInterval(() => setNow(Date.now()), TICK_MS)
      return () => window.clearInterval(timer)
    }

    const existing = durations.get(turnKey)
    if (existing && existing.endedAt === undefined) {
      existing.endedAt = Date.now()
      setNow(existing.endedAt)
    }
  }, [turnKey, isWorking])

  if (!turnKey) return undefined
  const live = readSeconds(durations.get(turnKey), now)
  if (live !== undefined) return live
  if (isWorking || persisted?.endedAt === undefined) return undefined
  return readSeconds(persisted, persisted.endedAt)
}
