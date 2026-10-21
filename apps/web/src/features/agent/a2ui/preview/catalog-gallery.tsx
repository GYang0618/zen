'use client'

import { A2UIProvider } from '@copilotkit/a2ui-renderer'
import { Badge, cn } from '@zen/ui'
import { useMemo } from 'react'

import { A2UISurfaceHost } from '@/features/agent/a2ui/a2ui-surface-host'
import { assembleRenderA2uiOperations } from '@/features/agent/a2ui/assemble-operations'
import { catalog } from '@/features/agent/a2ui/catalog'

import { CATALOG_DEMO_GROUPS } from './catalog-demos'

import type { A2UISurfaceDescriptor } from '@/features/agent/a2ui/use-a2ui-surfaces'
import type { CatalogDemo } from './catalog-demo'

function DemoSurface({ demo }: { demo: CatalogDemo }) {
  const surface = useMemo<A2UISurfaceDescriptor>(() => {
    const surfaceId = `catalog-${demo.id}`
    const operations =
      assembleRenderA2uiOperations({
        surfaceId,
        title: demo.name,
        components: demo.components
      }) ?? []

    return {
      surfaceId,
      title: demo.name,
      isExecuting: false,
      operations
    }
  }, [demo])

  return <A2UISurfaceHost surface={surface} />
}

export function CatalogGallery() {
  return (
    <A2UIProvider catalog={catalog}>
      <div className="space-y-10">
        {CATALOG_DEMO_GROUPS.map((group) => (
          <section key={group.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-tight">{group.title}</h2>
              <Badge variant="outline">{group.badge}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {group.demos.map((demo) => (
                <article
                  key={demo.id}
                  className={cn('min-w-0 space-y-2', demo.span === 'full' && 'lg:col-span-2')}
                >
                  <div>
                    <h3 className="text-xs font-medium">{demo.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{demo.description}</p>
                  </div>
                  <DemoSurface demo={demo} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </A2UIProvider>
  )
}
