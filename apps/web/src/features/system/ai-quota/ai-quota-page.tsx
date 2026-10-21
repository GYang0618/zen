import { formatCostMicros, formatTokens } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Edit,
  Plus,
  RefreshCw,
  Scale,
  ShieldAlert
} from 'lucide-react'
import { useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import {
  useAiModelPrices,
  useAiQuotas,
  useCreateAiModelPrice,
  useUpdateAiQuota
} from '../audit/queries'

import type { AiQuotaItem, CreateAiModelPriceDto, UpdateAiQuotaDto } from '../audit/api'

export function AiQuotaPage() {
  const { data: quotas, isLoading: quotasLoading, refetch: refetchQuotas } = useAiQuotas()
  const { data: prices, isLoading: pricesLoading, refetch: refetchPrices } = useAiModelPrices()

  const updateQuotaMutation = useUpdateAiQuota()
  const createPriceMutation = useCreateAiModelPrice()

  // 编辑配额抽屉
  const [editingQuota, setEditingQuota] = useState<AiQuotaItem | null>(null)
  const [quotaForm, setQuotaForm] = useState<UpdateAiQuotaDto>({})

  // 新增价格抽屉
  const [addingPrice, setAddingPrice] = useState(false)
  const [priceForm, setPriceForm] = useState<CreateAiModelPriceDto>({
    provider: 'openai',
    model: '',
    inputPriceMicros: 0,
    outputPriceMicros: 0
  })

  const handleOpenEditQuota = (item: AiQuotaItem) => {
    setEditingQuota(item)
    setQuotaForm({
      hardLimit: item.hardLimit,
      alertPercent: item.alertPercent,
      status: item.status
    })
  }

  const handleSaveQuota = async () => {
    if (!editingQuota) return
    await updateQuotaMutation.mutateAsync({
      id: editingQuota.id,
      data: quotaForm
    })
    setEditingQuota(null)
  }

  const handleCreatePrice = async () => {
    if (!priceForm.model.trim()) return
    await createPriceMutation.mutateAsync(priceForm)
    setAddingPrice(false)
    setPriceForm({
      provider: 'openai',
      model: '',
      inputPriceMicros: 0,
      outputPriceMicros: 0
    })
  }

  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-6">
        <AppPageHeader
          title="模型与配额"
          description="配置租户/部门/用户的 AI 调用用量硬上限与告警线，维护多模型版本化微元计价表"
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                void refetchQuotas()
                void refetchPrices()
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </Button>
          }
        />

        {/* 1. 配额水位看板 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Scale className="h-4 w-4 text-primary" />
              配额限制与使用水位
            </h3>
          </div>

          {quotasLoading ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-border">
              <Spinner />
            </div>
          ) : !quotas || quotas.length === 0 ? (
            <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
              系统当前采用默认全局预算保护策略（单次任务上限 256,000 Tokens）
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quotas.map((q) => {
                const isOver = q.usagePercent >= 100
                const isWarning = q.usagePercent >= q.alertPercent

                return (
                  <Card key={q.id} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {q.scope === 'TENANT'
                            ? '租户全局'
                            : q.scope === 'ORGANIZATION'
                              ? '部门组织'
                              : '指定用户'}
                        </Badge>
                        <Badge variant={q.status === 'ACTIVE' ? 'secondary' : 'outline'}>
                          {q.status === 'ACTIVE' ? '生效中' : '已停用'}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2 text-sm font-semibold">
                        {q.metric === 'TOTAL_TOKENS' ? 'Token 消耗上限' : '微元成本上限'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        周期：
                        {q.period === 'DAILY'
                          ? '每日重置'
                          : q.period === 'MONTHLY'
                            ? '每月重置'
                            : '累计永久'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium text-foreground">当前用量</span>
                        <span className="font-mono text-muted-foreground">
                          {q.metric === 'TOTAL_TOKENS'
                            ? `${formatTokens(q.currentUsage)} / ${formatTokens(q.hardLimit)}`
                            : `${formatCostMicros(q.currentUsage)} / ${formatCostMicros(q.hardLimit)}`}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(q.usagePercent, 100)}
                        className={`h-2 ${isOver ? 'bg-destructive/20 [&>div]:bg-destructive' : isWarning ? 'bg-amber-500/20 [&>div]:bg-amber-500' : ''}`}
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {isOver ? (
                            <span className="flex items-center gap-0.5 text-destructive font-medium">
                              <ShieldAlert className="h-3 w-3" />
                              已触发硬阻断 (100%)
                            </span>
                          ) : isWarning ? (
                            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              已超告警线 ({q.usagePercent}%)
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              水位正常 ({q.usagePercent}%)
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 px-2 text-xs"
                          onClick={() => handleOpenEditQuota(q)}
                        >
                          <Edit className="h-3 w-3" />
                          配置
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* 2. 模型计费表 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                模型微元定价表 (1 CNY = 1,000,000 微元)
              </h3>
              <p className="text-xs text-muted-foreground">
                支持版本化按生效日期区间生效，统一计算输入、输出、思考推理与缓存命中的精确成本
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setAddingPrice(true)}
            >
              <Plus className="h-4 w-4" />
              新增定价
            </Button>
          </div>

          <div className="rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">提供商</TableHead>
                  <TableHead>模型标识</TableHead>
                  <TableHead className="w-36">输入单价 (每 1M Tokens)</TableHead>
                  <TableHead className="w-36">输出单价 (每 1M Tokens)</TableHead>
                  <TableHead className="w-36">缓存命中单价</TableHead>
                  <TableHead className="w-36">生效起始</TableHead>
                  <TableHead className="w-24">当前状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricesLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Spinner />
                        <span>正在加载模型定价数据...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !prices || prices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      暂无模型定价规则
                    </TableCell>
                  </TableRow>
                ) : (
                  prices.map((p) => {
                    const isEffective = !p.effectiveTo || new Date(p.effectiveTo) > new Date()

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-xs text-foreground">
                          {p.provider}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {p.model}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">
                          {formatCostMicros(p.inputPriceMicros)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">
                          {formatCostMicros(p.outputPriceMicros)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.cachedInputPriceMicros
                            ? formatCostMicros(p.cachedInputPriceMicros)
                            : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(p.effectiveFrom).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isEffective ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {isEffective ? '当前生效' : '历史版本'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Main>

      {/* 编辑配额抽屉 */}
      <Sheet open={Boolean(editingQuota)} onOpenChange={(open) => !open && setEditingQuota(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>调整配额参数</SheetTitle>
            <SheetDescription>
              配置硬上限阈值与超额告警比例。达到硬上限将阻止新的 Agent 调用。
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>
                硬上限值 ({editingQuota?.metric === 'TOTAL_TOKENS' ? 'Tokens' : '微元'})
              </Label>
              <Input
                type="number"
                value={quotaForm.hardLimit ?? 0}
                onChange={(e) => setQuotaForm((f) => ({ ...f, hardLimit: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>告警百分比 (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={quotaForm.alertPercent ?? 80}
                onChange={(e) =>
                  setQuotaForm((f) => ({ ...f, alertPercent: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>管控状态</Label>
              <Select
                value={quotaForm.status ?? 'ACTIVE'}
                onValueChange={(val) =>
                  setQuotaForm((f) => ({ ...f, status: val as 'ACTIVE' | 'DISABLED' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">启用管控</SelectItem>
                  <SelectItem value="DISABLED">停用管控</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              onClick={handleSaveQuota}
              disabled={updateQuotaMutation.isPending}
            >
              {updateQuotaMutation.isPending ? '保存中...' : '保存更改'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 新增定价规则抽屉 */}
      <Sheet open={addingPrice} onOpenChange={setAddingPrice}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>新增模型微元定价</SheetTitle>
            <SheetDescription>
              设置模型每 1M Tokens 的微元费用（1 元人民币 = 1,000,000 微元）
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>模型提供商</Label>
              <Input
                value={priceForm.provider}
                onChange={(e) => setPriceForm((f) => ({ ...f, provider: e.target.value }))}
                placeholder="例如: openai, deepseek, anthropic"
              />
            </div>
            <div className="space-y-1.5">
              <Label>模型标识 (Model ID)</Label>
              <Input
                value={priceForm.model}
                onChange={(e) => setPriceForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="例如: gpt-4o, deepseek-chat"
              />
            </div>
            <div className="space-y-1.5">
              <Label>输入单价 (微元 / 1M Tokens)</Label>
              <Input
                type="number"
                value={priceForm.inputPriceMicros}
                onChange={(e) =>
                  setPriceForm((f) => ({ ...f, inputPriceMicros: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>输出单价 (微元 / 1M Tokens)</Label>
              <Input
                type="number"
                value={priceForm.outputPriceMicros}
                onChange={(e) =>
                  setPriceForm((f) => ({ ...f, outputPriceMicros: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>缓存输入单价 (微元 / 1M Tokens, 可选)</Label>
              <Input
                type="number"
                value={priceForm.cachedInputPriceMicros ?? 0}
                onChange={(e) =>
                  setPriceForm((f) => ({ ...f, cachedInputPriceMicros: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              onClick={handleCreatePrice}
              disabled={createPriceMutation.isPending || !priceForm.model.trim()}
            >
              {createPriceMutation.isPending ? '创建中...' : '提交生效'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
