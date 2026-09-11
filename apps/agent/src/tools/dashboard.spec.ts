import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildDynamicDashboardSurface } from '../a2ui'
import { generateDashboardTool } from './dashboard'

import type { User } from '@zen/shared'

describe('Dynamic Dashboard A2UI Builder & Tool', () => {
  it('buildDynamicDashboardSurface 生成正确的 A2UI 操作集与扁平组件树', () => {
    const operations = buildDynamicDashboardSurface({
      surfaceId: 'test-surface-1',
      title: '系统运维与活跃看板',
      summary: '实时监控系统用户与运营状态',
      metrics: [
        { label: '注册总数', value: '1,200', trend: 'up', trendValue: '+15%' },
        { label: '活跃用户', value: '850', trend: 'neutral' }
      ],
      chart: {
        title: '7日注册趋势',
        data: [
          { label: '周一', value: 100 },
          { label: '周二', value: 150 }
        ]
      },
      userTable: {
        title: '重点关注用户',
        users: [
          {
            id: 'u-1',
            username: 'alice',
            displayName: 'Alice',
            status: 'ACTIVE',
            email: 'alice@example.com'
          } as unknown as User
        ]
      }
    })

    assert.equal(operations.length, 3)
    assert.ok(operations[0]?.createSurface)
    assert.ok(operations[1]?.updateComponents)
    assert.ok(operations[2]?.updateDataModel)

    const updateOp = operations[1]?.updateComponents as {
      surfaceId: string
      components: Array<{ id: string; component: string }>
    }
    assert.equal(updateOp.surfaceId, 'test-surface-1')

    const root = updateOp.components.find((c) => c.id === 'root')
    assert.ok(root)
    assert.equal(root.component, 'Column')

    // 检查组件名
    const componentTypes = updateOp.components.map((c) => c.component)
    assert.ok(componentTypes.includes('Text'))
    assert.ok(componentTypes.includes('Row'))
    assert.ok(componentTypes.includes('Metric'))
    assert.ok(componentTypes.includes('BarChart'))
    assert.ok(componentTypes.includes('UserTable'))
    assert.ok(componentTypes.includes('Column'))

    // 检查数据绑定
    const updateDataOp = operations[2]?.updateDataModel as {
      value: {
        title: string
        summary: string
        metrics: unknown[]
        chart: { title: string }
        users: unknown[]
      }
    }
    assert.equal(updateDataOp.value.title, '系统运维与活跃看板')
    assert.equal(updateDataOp.value.summary, '实时监控系统用户与运营状态')
    assert.equal(updateDataOp.value.metrics.length, 2)
    assert.equal(updateDataOp.value.chart.title, '7日注册趋势')
    assert.equal(updateDataOp.value.users.length, 1)
  })

  it('generateDashboardTool 工具元数据与 invoke 正常运行', async () => {
    assert.equal(generateDashboardTool.name, 'generate_dynamic_dashboard')
    assert.ok(generateDashboardTool.description.includes('动态 A2UI 数据看板'))

    const rawResult = await generateDashboardTool.invoke({
      title: '轻量看板',
      metrics: [{ label: 'CPU使用率', value: '25%' }]
    })

    const result = JSON.parse(rawResult as string)
    assert.equal(result.code, 200)
    assert.equal(result.data.title, '轻量看板')
    assert.equal(result.data.metricsCount, 1)
    assert.equal(result.data.hasChart, false)
    assert.equal(result.data.hasUserTable, false)
    assert.ok(Array.isArray(result.a2ui_operations))
    assert.equal(result.a2ui_operations.length, 3)
  })
})
