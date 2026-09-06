// @vitest-environment jsdom

import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { DataTable } from './data-table'

afterEach(cleanup)

function Harness({ isError = false }: { isError?: boolean }) {
  const [rowSelection, setRowSelection] = useState({})
  const table = useReactTable({
    data: [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' }
    ],
    columns: [{ accessorKey: 'name', header: '姓名' }],
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })
  return <DataTable table={table} isError={isError} error="加载失败" />
}

describe('DataTable keyboard and error', () => {
  it('方向键移动活动行并用空格切换选择', () => {
    render(<Harness />)
    const table = screen.getByRole('table', { name: '数据表格' })
    table.focus()
    fireEvent.keyDown(table, { key: 'ArrowDown' })
    fireEvent.keyDown(table, { key: ' ' })
    expect(screen.getByText('Alice').closest('tr')?.getAttribute('data-state')).toBe('selected')
  })

  it('错误态展示可访问的失败文案', () => {
    render(<Harness isError />)
    expect(screen.getByRole('alert').textContent).toContain('加载失败')
  })
})
