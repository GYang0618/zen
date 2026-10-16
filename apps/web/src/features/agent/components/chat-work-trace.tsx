'use client'

import {
  Shimmer,
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceLine,
  TraceTitle
} from '@zen/ui'
import { useEffect, useRef, useState } from 'react'

import { useWorkDuration } from '../hooks/use-work-duration'
import { formatWorkStatusTitle } from '../lib/format-work-duration'
import { WorkingPet } from './working-pet'

import type { ReactNode } from 'react'
import type { WorkStatus } from '../lib/format-work-duration'

const AUTO_CLOSE_DELAY_MS = 1000

interface ChatWorkTraceProps {
  turnKey: string
  /** 回合已开始，但还没有可折叠的工作内容。 */
  isWaiting: boolean
  /** 已有工作内容且仍在执行。 */
  isWorking: boolean
  workStartedAt?: number
  workEndedAt?: number
  children: ReactNode
}

export function ChatWorkTrace({
  turnKey,
  isWaiting,
  isWorking,
  workStartedAt,
  workEndedAt,
  children
}: ChatWorkTraceProps) {
  const durationSeconds = useWorkDuration(
    turnKey,
    isWorking,
    workStartedAt !== undefined && workEndedAt !== undefined
      ? { startedAt: workStartedAt, endedAt: workEndedAt }
      : undefined
  )
  const [open, setOpen] = useState(isWorking)
  const hasWorkedRef = useRef(isWorking)
  const hasAutoClosedRef = useRef(false)

  useEffect(() => {
    if (!isWorking) return
    hasWorkedRef.current = true
    hasAutoClosedRef.current = false
    setOpen(true)
  }, [isWorking])

  useEffect(() => {
    if (!hasWorkedRef.current || isWorking || !open || hasAutoClosedRef.current) return
    const timer = window.setTimeout(() => {
      setOpen(false)
      hasAutoClosedRef.current = true
    }, AUTO_CLOSE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isWorking, open])

  const status: WorkStatus = isWaiting ? 'waiting' : isWorking ? 'working' : 'done'
  const title = formatWorkStatusTitle(status, durationSeconds)
  const showPet = status !== 'done'
  const summary = (
    <TraceLine
      status={status === 'done' ? undefined : status === 'waiting' ? 'pending' : 'running'}
      className="overflow-visible py-0.5"
    >
      {showPet ? <WorkingPet /> : null}
      <TraceTitle>
        {status === 'done' ? (
          title
        ) : (
          <Shimmer as="span" duration={1}>
            {title}
          </Shimmer>
        )}
      </TraceTitle>
    </TraceLine>
  )

  if (isWaiting) {
    return <Trace>{summary}</Trace>
  }

  return (
    <Trace>
      <TraceCollapsible open={open} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>{summary}</TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="flex flex-col gap-2">
          {children}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}
