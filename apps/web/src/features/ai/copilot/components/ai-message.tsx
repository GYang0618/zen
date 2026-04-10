import { Button } from '@zen/ui/index'
import { Copy, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'

export default function AIMessage({ message }: { message: string }) {
  return (
    <div>
      <div> {message}</div>
      <div className="h-9 flex items-center gap-1">
        <Button size="icon-sm" variant="ghost">
          <Copy />
        </Button>

        <Button size="icon-sm" variant="ghost">
          <ThumbsUp />
        </Button>

        <Button size="icon-sm" variant="ghost">
          <ThumbsDown />
        </Button>

        <Button size="icon-sm" variant="ghost">
          <RefreshCw />
        </Button>
      </div>
    </div>
  )
}
