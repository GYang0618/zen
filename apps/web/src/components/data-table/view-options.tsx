import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@zen/ui'

import type { Table } from '@tanstack/react-table'

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ms-auto hidden h-8 lg:flex">
          <MixerHorizontalIcon className="size-4" />
          视图
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>切换列</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.columnDef.meta?.title || column.id}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
