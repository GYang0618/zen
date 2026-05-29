import { useComponent } from '@copilotkit/react-core/v2'
import { Card, CardContent, CardHeader, CardTitle } from '@zen/ui'
import z from 'zod'

export function useObjectPropertiesCard() {
  useComponent({
    name: 'object_properties',
    description: '构件属性展示信息卡片',
    parameters: z.record(z.string(), z.any()).describe('构件属性信息'),
    render: (data) => <ObjectPropertiesCard data={data} />
  })
}

export function ObjectPropertiesCard({ data }: { data: Record<string, unknown> }) {
  console.log('🚀 ~ ObjectPropertiesCard ~ data:', data)
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return null
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>属性信息</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[minmax(6rem,30%)_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">{key}:</span>
            <span className="break-all">{String(value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
