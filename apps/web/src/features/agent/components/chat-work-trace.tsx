'use client'

import { Shimmer } from '@zen/ui'
import { useEffect, useRef, useState } from 'react'

import { useWorkDuration } from '../hooks/use-work-duration'
import { formatWorkDurationTitle } from '../lib/format-work-duration'
import { ChatFoldPanel } from './chat-fold-panel'

import type { ReactNode } from 'react'

const AUTO_CLOSE_DELAY_MS = 1000

interface ChatWorkTraceProps {
  turnKey: string
  isWorking: boolean
  children: ReactNode
}

export function ChatWorkTrace({ turnKey, isWorking, children }: ChatWorkTraceProps) {
  const durationSeconds = useWorkDuration(turnKey, isWorking)
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

  const title = formatWorkDurationTitle(isWorking, durationSeconds)

  return (
    <ChatFoldPanel
      open={open}
      onOpenChange={setOpen}
      trigger={
        isWorking ? (
          <Shimmer as="span" className="leading-none" duration={1}>
            {title}
          </Shimmer>
        ) : (
          <span className="leading-none">{title}</span>
        )
      }
    >
      <div className="pt-4 flex flex-col gap-6">{children}</div>
    </ChatFoldPanel>
  )
}
