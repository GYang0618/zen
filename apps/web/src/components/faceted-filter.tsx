import {
  Badge,
  Button,
  Checkbox,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  Field,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator
} from '@zen/ui'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'

export function FacetedFilter({ options }: { options: { label: string; value: string }[] }) {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())

  const selectedOptions = options.filter((option) => selectedValues.has(option.value))

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" className="border-dashed">
          <PlusCircle />
          状态
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} 项
                  </Badge>
                ) : (
                  selectedOptions.map((option) => (
                    <Badge
                      variant="secondary"
                      key={option.value}
                      className="rounded-sm px-1 font-normal"
                    >
                      {option.label}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      setSelectedValues((prev) => {
                        const next = new Set(prev)
                        if (isSelected) {
                          next.delete(option.value)
                        } else {
                          next.add(option.value)
                        }
                        return next
                      })
                    }}
                  >
                    <Field orientation="horizontal">
                      <Checkbox checked={isSelected} />
                      <Label htmlFor={option.value}>{option.label}</Label>
                    </Field>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setSelectedValues(new Set())}
                    className="justify-center text-center"
                  >
                    清除筛选
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
