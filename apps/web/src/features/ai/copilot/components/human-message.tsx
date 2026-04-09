import { Button } from '@zen/ui/index'
import { Copy, Pencil } from 'lucide-react'

export function HumanMessage({ message }: { message: string }) {
  return (
    <div className="group flex flex-col items-end">
      <div className="max-w-7/10 px-3 py-2  rounded-[16px_0_16px_16px] bg-primary/90 text-primary-foreground/75">
        {message}
      </div>
      <div className="ml-auto flex h-9 items-center gap-1 opacity-0 pointer-events-none transition-opacity duration-200 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
        <Button size="icon-sm" variant="ghost">
          <Pencil />
        </Button>
        <Button size="icon-sm" variant="ghost">
          <Copy />
        </Button>
      </div>
    </div>
  )
}
