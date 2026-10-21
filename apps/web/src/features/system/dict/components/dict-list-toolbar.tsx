import { InputGroup, InputGroupAddon, InputGroupInput, TabsList, TabsTrigger } from '@zen/ui'
import { LayoutGrid, Search, TextAlignStart } from 'lucide-react'

import { FacetedFilter } from '@/components/faceted-filter'

interface DictListToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  kindFilter: string[]
  onKindFilterChange: (values: string[]) => void
}

const KIND_OPTIONS = [
  { label: '业务', value: 'business' },
  { label: '系统', value: 'system' }
]

export function DictListToolbar({
  search,
  onSearchChange,
  kindFilter,
  onKindFilterChange
}: DictListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-1">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-64 sm:w-72">
          <InputGroupInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索字典名称、编码、描述"
          />
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        <FacetedFilter
          title="性质"
          options={KIND_OPTIONS}
          value={kindFilter}
          onValueChange={onKindFilterChange}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <TabsList>
          <TabsTrigger value="grid" aria-label="网格视图">
            <LayoutGrid className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="list" aria-label="列表视图">
            <TextAlignStart className="size-4" />
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  )
}
