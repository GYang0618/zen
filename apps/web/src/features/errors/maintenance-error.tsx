import { Button } from '@zen/ui'

export function MaintenanceError() {
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">503</h1>
        <span className="font-medium">网站维护中！</span>
        <p className="text-center text-muted-foreground">
          当前网站暂不可用。
          <br />
          我们将很快恢复服务。
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline">了解更多</Button>
        </div>
      </div>
    </div>
  )
}
