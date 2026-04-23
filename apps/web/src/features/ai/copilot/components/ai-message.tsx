import { cjk } from '@streamdown/cjk'
import { Button } from '@zen/ui'
import { Copy, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Streamdown } from 'streamdown'
import 'streamdown/styles.css'

import { useCopilot } from '../copilot-provider'

export default function AIMessage({
  message,
  isAnimating
}: {
  message: string
  isAnimating?: boolean
}) {
  const { regenerate } = useCopilot()

  return (
    <div>
      <div className="[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6">
        <Streamdown plugins={{ cjk }} animated isAnimating={isAnimating}>
          {message}
        </Streamdown>
      </div>
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

        <Button size="icon-sm" variant="ghost" onClick={() => regenerate()}>
          <RefreshCw />
        </Button>
      </div>
    </div>
  )
}
