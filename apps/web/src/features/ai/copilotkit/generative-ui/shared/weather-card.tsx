import { useComponent } from '@copilotkit/react-core/v2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zen/ui'
import z from 'zod'

const weatherCardSchema = z.object({
  city: z.string().describe('城市名称'),
  unit: z.enum(['c', 'f']).default('c')
})

type WeatherCardProps = z.infer<typeof weatherCardSchema>

export function useWeatherCard() {
  useComponent(
    {
      name: 'showWeather',
      description: '渲染对应城市的天气信息卡片',
      parameters: z.object({
        city: z.string().describe('城市名称'),
        unit: z.enum(['c', 'f']).default('c')
      }),
      render: ({ city, unit }) => <WeatherCard city={city} unit={unit} />
    },
    []
  )
}

function WeatherCard({ city, unit }: WeatherCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{city}</CardTitle>
        <CardDescription>关于天气信息的描述</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          {city}的天气是: 35{unit === 'c' ? '摄氏度' : '华氏度'}
        </p>
      </CardContent>
    </Card>
  )
}
