import { Button, InputGroup, InputGroupAddon, InputGroupTextarea } from '@zen/ui'
import { Mic, Paperclip, Send } from 'lucide-react'

export function ChartInputV2() {
  return (
    <InputGroup className="rounded-4xl px-1 py-2 bg-background shadow-lg mb-10">
      <InputGroupTextarea className=" pl-5 max-h-50 overflow-y-auto" placeholder="输入你的问题" />

      <InputGroupAddon align="block-end">
        <Button
          variant="ghost"
          className="rounded-full size-11"
          title="attach file"
          type="button"
          tabIndex={-1}
        >
          <Paperclip className="size-5" />
        </Button>

        <div className="ml-auto">
          <Button variant="ghost" className="rounded-full size-11" title="Voice input">
            <Mic className="size-5" />
          </Button>
          <Button className="rounded-full size-11" title="send" tabIndex={-1}>
            <Send className="size-4.5" />
          </Button>
        </div>
      </InputGroupAddon>
    </InputGroup>
  )
}
