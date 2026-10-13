'use client'

import { Shimmer } from '@zen/ui'
import { useEffect, useRef, useState } from 'react'

import { useWorkDuration } from '../hooks/use-work-duration'
import { formatWorkStatusTitle } from '../lib/format-work-duration'
import { ChatFoldPanel } from './chat-fold-panel'
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
  const titleNode =
    status === 'done' ? (
      <span className="leading-none">{title}</span>
    ) : (
      <Shimmer as="span" className="leading-none" duration={1}>
        {title}
      </Shimmer>
    )

  return (
    <ChatFoldPanel
      open={open}
      onOpenChange={setOpen}
      expandable={!isWaiting}
      trigger={
        <span className="inline-flex items-center gap-1.5">
          {showPet ? <WorkingPet /> : null}
          {titleNode}
        </span>
      }
    >
      <div className="pt-4 flex flex-col gap-4">{children}</div>
    </ChatFoldPanel>
  )
}
