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

interface FacetedFilterProps {
  options: { label: string; value: string }[]
  title?: string
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export function FacetedFilter({
  options,
  title = '状态',
  value,
  defaultValue,
  onValueChange
}: FacetedFilterProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<Set<string>>(
    () => new Set(defaultValue)
  )
  const isControlled = value !== undefined
  const selectedValues = isControlled ? new Set(value) : uncontrolledValue

  const updateSelectedValues = (next: Set<string>) => {
    if (!isControlled) {
      setUncontrolledValue(next)
    }
    onValueChange?.(Array.from(next))
  }

  const selectedOptions = options.filter((option) => selectedValues.has(option.value))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <PlusCircle />
          {title}
          {selectedValues.size > 0 && (
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
                      const next = new Set(selectedValues)
                      if (isSelected) {
                        next.delete(option.value)
                      } else {
                        next.add(option.value)
                      }
                      updateSelectedValues(next)
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
                    onSelect={() => updateSelectedValues(new Set())}
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
