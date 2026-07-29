import { Sparkle } from 'lucide-react'

export function SkillsPromo({ installedCount }: { installedCount: number }) {
  return (
    <section className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkle />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium">让每个智能体都更擅长自己的工作</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            已安装 {installedCount} 个技能，可随时在此管理。
          </p>
        </div>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <Metric value="38" label="可用技能" />
        <div className="border-l pl-5">
          <Metric value="12" label="已验证发布者" />
        </div>
      </div>
    </section>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-medium">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  )
}
