import { cjk } from '@streamdown/cjk'
import { Button } from '@zen/ui'
import { Copy, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Streamdown } from 'streamdown'
import 'streamdown/styles.css'

export default function AIMessage({
  message,
  isAnimating
}: {
  message: string
  isAnimating?: boolean
}) {
  return (
    <div>
      <Streamdown plugins={{ cjk }} animated isAnimating={isAnimating}>
        {message}
      </Streamdown>
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
