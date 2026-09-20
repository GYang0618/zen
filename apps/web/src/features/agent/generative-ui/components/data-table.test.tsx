// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DataTable } from './data-table'

import type { ColumnDef } from '@tanstack/react-table'

interface TestUser {
  id: string
  name: string
  age: number
}

const columns: ColumnDef<TestUser>[] = [
  {
    accessorKey: 'name',
    header: '姓名'
  },
  {
    accessorKey: 'age',
    header: '年龄'
  }
]

const testData: TestUser[] = [
  { id: '1', name: 'Alice', age: 25 },
  { id: '2', name: 'Bob', age: 30 },
  { id: '3', name: 'Charlie', age: 20 }
]

describe('DataTable (Generative UI)', () => {
  afterEach(() => {
    cleanup()
  })

  it('正常渲染表头和数据行', () => {
    render(<DataTable data={testData} columns={columns} />)

    expect(screen.getByText('姓名')).toBeDefined()
    expect(screen.getByText('年龄')).toBeDefined()
    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
    expect(screen.getByText('Charlie')).toBeDefined()
    expect(screen.getByText('25')).toBeDefined()
  })

  it('数据为空且非加载态时展示空状态提示', () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="没有任何数据" />)

    expect(screen.getByText('没有任何数据')).toBeDefined()
  })

  it('isLoading 为 true 且数据为空时展示骨架屏', () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} isLoading={true} skeletonRowCount={4} />
    )

    // 每行有 2 个单元格，共 4 行骨架
    const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletonElements.length).toBe(8)
    expect(screen.queryByText('暂无数据')).toBeNull()
  })

  it('点击文本表头支持按升序与降序排序', () => {
    render(<DataTable data={testData} columns={columns} />)

    const ageHeaderButton = screen.getByRole('button', { name: '按年龄排序' })

    // 初始顺序: Alice (25), Bob (30), Charlie (20)
    let cells = screen.getAllByRole('cell')
    expect(cells[0].textContent).toBe('Alice')

    // 第一次点击：升序 (20, 25, 30) -> Charlie, Alice, Bob
    fireEvent.click(ageHeaderButton)
    cells = screen.getAllByRole('cell')
    expect(cells[0].textContent).toBe('Charlie')
    expect(cells[2].textContent).toBe('Alice')
    expect(cells[4].textContent).toBe('Bob')

    // 第二次点击：降序 (30, 25, 20) -> Bob, Alice, Charlie
    fireEvent.click(ageHeaderButton)
    cells = screen.getAllByRole('cell')
    expect(cells[0].textContent).toBe('Bob')
    expect(cells[2].textContent).toBe('Alice')
    expect(cells[4].textContent).toBe('Charlie')
  })

  it('isFetching 为 true 时带有透明度效果', () => {
    const { container } = render(<DataTable data={testData} columns={columns} isFetching={true} />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('opacity-70')
  })
})
