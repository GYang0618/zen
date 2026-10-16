'use client'

import { useEffect, useState } from 'react'

import { elapsedDurationSeconds } from '../lib/format-work-duration'

const TICK_MS = 1000

interface ReasoningDurationEntry {
  startedAt: number
  endedAt?: number
}

const entries = new Map<string, ReasoningDurationEntry>()

function readLiveSeconds(entry: ReasoningDurationEntry, now: number): number {
  return Math.max(0, Math.floor((now - entry.startedAt) / TICK_MS))
}

function readSettledSeconds(entry: ReasoningDurationEntry): number {
  const end = entry.endedAt ?? entry.startedAt
  return Math.max(1, Math.ceil((end - entry.startedAt) / TICK_MS))
}

/**
 * 实时思考用本页时钟，从这条消息开始输出记到它不再是当前消息。
 * 历史消息用已保存的起止时间。两边都有时取更长的一段，避免同一批事件被记成 1 秒。
 */
export function useReasoningDuration(
  messageId: string | undefined,
  isStreaming: boolean,
  persisted?: { startedAt?: number; endedAt?: number }
): number | undefined {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!messageId) return

    if (isStreaming) {
      if (!entries.has(messageId)) entries.set(messageId, { startedAt: Date.now() })
      setNow(Date.now())
      const timer = window.setInterval(() => setNow(Date.now()), TICK_MS)
      return () => window.clearInterval(timer)
    }

    const existing = entries.get(messageId)
    if (existing && existing.endedAt === undefined) {
      existing.endedAt = Date.now()
      setNow(existing.endedAt)
    }
  }, [isStreaming, messageId])

  const entry = messageId ? entries.get(messageId) : undefined
  if (isStreaming) return entry ? readLiveSeconds(entry, now) : undefined
  if (entry && entry.endedAt === undefined) return readLiveSeconds(entry, now)
  if (!messageId) return undefined

  const local = entry ? readSettledSeconds(entry) : undefined
  const stored = elapsedDurationSeconds(persisted?.startedAt, persisted?.endedAt, 'ceil')
  if (local === undefined) return stored
  if (stored === undefined) return local
  return Math.max(local, stored)
}
