'use client'

import { useControllableState } from '@radix-ui/react-use-controllable-state'
import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@zen/ui/components/collapsible'
import { cn } from '@zen/ui/lib/utils'
import { BrainIcon, ChevronRightIcon } from 'lucide-react'
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { Streamdown } from 'streamdown'

import { Shimmer } from './shimmer'

import type { ComponentProps, ReactNode } from 'react'

interface ReasoningContextValue {
  isStreaming: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  duration: number | undefined
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null)

export const useReasoning = () => {
  const context = useContext(ReasoningContext)
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning')
  }
  return context
}

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  duration?: number
}

const MS_IN_S = 1000

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = false,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState<boolean>({
      defaultProp: defaultOpen,
      onChange: onOpenChange,
      prop: open
    })
    const [duration, setDuration] = useControllableState<number | undefined>({
      defaultProp: undefined,
      prop: durationProp
    })

    const startTimeRef = useRef<number | null>(null)

    useEffect(() => {
      if (isStreaming) {
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now()
        }
      } else if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S))
        startTimeRef.current = null
      }
    }, [isStreaming, setDuration])

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        setIsOpen(newOpen)
      },
      [setIsOpen]
    )

    const contextValue = useMemo(
      () => ({ duration, isOpen, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen]
    )

    return (
      <ReasoningContext.Provider value={contextValue}>
        <Collapsible
          className={cn('not-prose mb-4', className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    )
  }
)

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode
}

const defaultGetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming) {
    return (
      <Shimmer as="span" className="leading-none" duration={1}>
        思考中...
      </Shimmer>
    )
  }
  if (duration === undefined) {
    return <span className="leading-none">思考了片刻</span>
  }
  return <span className="leading-none">已思考 {duration} 秒</span>
}

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning()

    return (
      <CollapsibleTrigger
        className={cn(
          'group flex w-full items-center overflow-visible text-muted-foreground text-sm leading-none transition-colors hover:text-foreground',
          className
        )}
        {...props}
      >
        {children ?? (
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex size-3.5 shrink-0 -translate-y-px items-center justify-center">
              <BrainIcon
                className={cn(
                  'block size-3.5 transition-opacity',
                  isOpen ? 'opacity-0' : 'group-hover:opacity-0 group-focus-visible:opacity-0'
                )}
              />
              <ChevronRightIcon
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute inset-0 m-auto block size-3.5 transition-[opacity,transform]',
                  isOpen
                    ? 'rotate-90 opacity-100'
                    : 'rotate-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                )}
              />
            </span>
            {getThinkingMessage(isStreaming, duration)}
          </span>
        )}
      </CollapsibleTrigger>
    )
  }
)

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent> & {
  children: string
  animated?: boolean | ComponentProps<typeof Streamdown>['animated']
  isAnimating?: boolean
}

const streamdownPlugins = { cjk, code, math, mermaid }

export const ReasoningContent = memo(
  ({
    className,
    children,
    animated = true,
    isAnimating: isAnimatingProp,
    ...props
  }: ReasoningContentProps) => {
    const { isStreaming } = useReasoning()
    const isAnimating = isAnimatingProp ?? isStreaming

    return (
      <CollapsibleContent
        className={cn(
          'mt-4 text-sm',
          'data-closed:fade-out-0 data-closed:slide-out-to-top-2 data-open:slide-in-from-top-2 data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-closed:animate-out data-open:animate-in data-[state=closed]:animate-out data-[state=open]:animate-in',
          className
        )}
        {...props}
      >
        <Streamdown
          animated={animated}
          isAnimating={isAnimating}
          caret={isAnimating ? 'block' : undefined}
          plugins={streamdownPlugins}
        >
          {children}
        </Streamdown>
      </CollapsibleContent>
    )
  }
)

Reasoning.displayName = 'Reasoning'
ReasoningTrigger.displayName = 'ReasoningTrigger'
ReasoningContent.displayName = 'ReasoningContent'
