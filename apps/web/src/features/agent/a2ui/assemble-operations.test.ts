import { describe, expect, it } from 'vitest'

import { assembleRenderA2uiOperations, normalizeA2uiOperations } from './assemble-operations'

describe('A2UI component normalization', () => {
  it('fills missing ids and flattens nested props in render_a2ui arguments', () => {
    const operations = assembleRenderA2uiOperations({
      components: [
        { component: 'Column', children: ['metric'] },
        { props: { component: 'StatCard', title: '请求数' } }
      ]
    })

    expect(operations?.[1]).toMatchObject({
      updateComponents: {
        components: [
          { id: 'root', component: 'Column' },
          { id: 'component-0', component: 'StatCard', title: '请求数' }
        ]
      }
    })
  })

  it('repairs native operations and removes components without a catalog type', () => {
    const operations = normalizeA2uiOperations([
      {
        updateComponents: {
          surfaceId: 'native-surface',
          components: [
            { component: 'Column' },
            { id: 'metric', component: 'StatCard' },
            { id: 'broken', title: 'missing type' }
          ]
        }
      }
    ])

    expect(operations[0]).toMatchObject({
      updateComponents: {
        components: [
          { id: 'root', component: 'Column' },
          { id: 'metric', component: 'StatCard' }
        ]
      }
    })
  })

  it('returns null when no valid renderable components remain', () => {
    expect(assembleRenderA2uiOperations({ components: [{ id: 'root' }] })).toBeNull()
  })
})
