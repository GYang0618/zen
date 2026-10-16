import { Tabs as BaseTabs, cn, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useState } from 'react'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { IconName } from 'lucide-react/dynamic'

export interface A2uiTabItem {
  key: string
  label: string
  icon?: string
  child?: string
}

export interface A2uiTabsProps {
  items: A2uiTabItem[]
  defaultValue?: string
  className?: string
}

export function Tabs({ props, children }: RendererProps<A2uiTabsProps>) {
  const { items = [], defaultValue, className } = props
  const initialKey = defaultValue ?? items[0]?.key ?? ''
  const [activeKey, setActiveKey] = useState(initialKey)

  if (!items.length) return null

  return (
    <BaseTabs
      value={activeKey}
      onValueChange={setActiveKey}
      className={cn('w-full flex flex-col gap-3', className)}
    >
      <TabsList className="w-fit">
        {items.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
            {tab.icon ? <DynamicIcon name={tab.icon as IconName} className="size-3.5" /> : null}
            <span>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className="w-full">
          {tab.child ? children(tab.child) : null}
        </TabsContent>
      ))}
    </BaseTabs>
  )
}
