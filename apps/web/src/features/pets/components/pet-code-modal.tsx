import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@zen/ui'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PRESET_PETS } from '../constants/pets-data'
import { usePetsStore } from '../stores/use-pets-store'

export function PetCodeModal() {
  const codePetId = usePetsStore((s) => s.codePetId)
  const setCodePetId = usePetsStore((s) => s.setCodePetId)
  const [copied, setCopied] = useState(false)

  const pet = PRESET_PETS.find((p) => p.id === codePetId)
  if (!pet) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pet.rawSvg)
      setCopied(true)
      toast.success('SVG 源码已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动选择复制')
    }
  }

  return (
    <Dialog open={Boolean(codePetId)} onOpenChange={(open) => !open && setCodePetId(null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>
              {pet.name} · {pet.chineseName}
            </span>
            <span className="font-mono text-xs text-muted-foreground font-normal">
              SVG 代码提取
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            此代码为原画级纯净 SVG 形状路径，可直接导出嵌入至任意 Web 应用或矢量设计工具中。
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/40 p-3 dark:bg-black/60">
          <pre className="max-h-64 overflow-auto font-mono text-xs text-foreground/90 selection:bg-primary/30">
            <code>{pet.rawSvg}</code>
          </pre>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCodePetId(null)}>
            关闭
          </Button>
          <Button size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? '已复制' : '复制代码'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
