import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import {
  ArrowUp,
  AtSign,
  BookOpen,
  CircleDashed,
  Globe,
  LayoutGrid,
  Paperclip,
  Plus,
  X
} from 'lucide-react'
import { useState } from 'react'

import { data } from '../data/data'

import type { SubmitEvent } from 'react'

interface NotionPromptFormProps {
  onSubmit?: (value: string) => void
  className?: string
}

export function NotionPromptForm({ onSubmit, className }: NotionPromptFormProps) {
  const [inputValue, setInputValue] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [mentionPopoverOpen, setMentionPopoverOpen] = useState(false)
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<(typeof data.models)[0]>(data.models[0])
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false)

  const grouped = data.mentionable.reduce(
    (acc, item) => {
      const isAvailable = !mentions.includes(item.title)

      if (isAvailable) {
        if (!acc[item.type]) {
          acc[item.type] = []
        }
        acc[item.type].push(item)
      }
      return acc
    },
    {} as Record<string, typeof data.mentionable>
  )

  const hasMentions = mentions.length > 0

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit?.(inputValue)
    setInputValue('')
    setMentions([])
  }

  return (
    <form className={cn(className)} onSubmit={handleSubmit}>
      <Field>
        <FieldLabel htmlFor="notion-prompt" className="sr-only">
          提示词
        </FieldLabel>

        <InputGroup className="rounded-xl">
          <InputGroupTextarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            id="notion-prompt"
            placeholder="提问、搜索或做任何事..."
            onKeyDown={(e) => {
              if (!inputValue) return
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <InputGroupAddon align="block-start" className="pt-3">
            <Popover open={mentionPopoverOpen} onOpenChange={setMentionPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild onFocusCapture={(e) => e.stopPropagation()}>
                  <PopoverTrigger asChild>
                    <InputGroupButton
                      variant="outline"
                      size={!hasMentions ? 'sm' : 'icon-sm'}
                      className="transition-transform"
                    >
                      <AtSign /> {!hasMentions && '添加上下文'}
                    </InputGroupButton>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>提及一个人、页面或日期</TooltipContent>
              </Tooltip>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder="搜索页面..." />
                  <CommandList>
                    <CommandEmpty>未找到页面</CommandEmpty>
                    {Object.entries(grouped).map(([type, items]) => (
                      <CommandGroup key={type} heading={type === 'page' ? '页面' : '用户'}>
                        {items.map((item) => (
                          <CommandItem
                            key={item.title}
                            value={item.title}
                            onSelect={(currentValue) => {
                              setMentions((prev) => [...prev, currentValue])
                              setMentionPopoverOpen(false)
                            }}
                            className="rounded-lg"
                          >
                            <MentionableIcon item={item} />
                            {item.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="-m-1.5 no-scrollbar flex gap-1 overflow-y-auto p-1.5">
              {mentions.map((mention) => {
                const item = data.mentionable.find((item) => item.title === mention)

                if (!item) {
                  return null
                }

                return (
                  <InputGroupButton
                    key={mention}
                    size="sm"
                    variant="secondary"
                    className="rounded-full pl-2!"
                    onClick={() => {
                      setMentions((prev) => prev.filter((m) => m !== mention))
                    }}
                  >
                    <MentionableIcon item={item} />
                    {item.title}
                    <X />
                  </InputGroupButton>
                )
              })}
            </div>
          </InputGroupAddon>
          <InputGroupAddon align="block-end" className="gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton size="icon-sm" className="rounded-full" aria-label="附加文件">
                  <Paperclip />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>附加文件</TooltipContent>
            </Tooltip>
            <DropdownMenu open={modelPopoverOpen} onOpenChange={setModelPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton size="sm" className="rounded-full">
                      {selectedModel.name}
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>选择 AI 模型</TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="top" align="start" className="min-w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    选择代理模式
                  </DropdownMenuLabel>
                  {data.models.map((model) => (
                    <DropdownMenuCheckboxItem
                      key={model.name}
                      checked={model.name === selectedModel.name}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedModel(model)
                        }
                      }}
                      className="pl-2 *:[span:first-child]:right-2 *:[span:first-child]:left-auto"
                    >
                      {model.name}
                      {model.badge && (
                        <Badge
                          variant="secondary"
                          className="h-5 rounded-sm bg-blue-100 px-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        >
                          {model.badge}
                        </Badge>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu open={scopeMenuOpen} onOpenChange={setScopeMenuOpen}>
              <DropdownMenuTrigger asChild>
                <InputGroupButton size="sm" className="rounded-full">
                  <Globe /> 所有资源
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-72">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                    <label htmlFor="web-search">
                      <Globe /> 网络搜索{' '}
                      <Switch id="web-search" className="ml-auto" defaultChecked />
                    </label>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                    <label htmlFor="apps">
                      <LayoutGrid /> 应用与集成
                      <Switch id="apps" className="ml-auto" defaultChecked />
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span className="relative inline-flex size-4 items-center justify-center">
                      <CircleDashed className="size-4" />
                      <Plus className="absolute size-2.5" />
                    </span>
                    我可以访问的所有源
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Avatar className="size-4">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      shadcn
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-72 p-0 [--radius:1rem]">
                      <Command>
                        <CommandInput placeholder="查找或使用知识..." autoFocus />
                        <CommandList>
                          <CommandEmpty>未找到知识</CommandEmpty>
                          <CommandGroup>
                            {data.mentionable
                              .filter((item) => item.type === 'user')
                              .map((user) => (
                                <CommandItem
                                  key={user.title}
                                  value={user.title}
                                  onSelect={() => {
                                    // Handle user selection here
                                    console.log('Selected user:', user.title)
                                  }}
                                >
                                  <Avatar className="size-4">
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback>{user.title[0]}</AvatarFallback>
                                  </Avatar>
                                  {user.title}{' '}
                                  <span className="text-muted-foreground">- {user.workspace}</span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem>
                    <BookOpen /> 帮助中心
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Plus /> 连接应用
                  </DropdownMenuItem>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    我们只会在此处选定的源中搜索。
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <InputGroupButton
              type="submit"
              aria-label="发送"
              className="ml-auto rounded-full"
              variant="default"
              size="icon-sm"
            >
              <ArrowUp />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </form>
  )
}

function MentionableIcon({ item }: { item: (typeof data.mentionable)[0] }) {
  return item.type === 'page' ? (
    <span className="flex size-4 items-center justify-center">{item.image}</span>
  ) : (
    <Avatar className="size-4">
      <AvatarImage src={item.image} />
      <AvatarFallback>{item.title[0]}</AvatarFallback>
    </Avatar>
  )
}
