// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(cleanup)

describe('Base UI overlay keyboard contract', () => {
  it('打开后对话框可被键盘聚焦的按钮触发', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>确认</DialogTitle>
          <DialogDescription>请确认后继续</DialogDescription>
          <Button type="button">确定</Button>
        </DialogContent>
      </Dialog>
    )
    const dialog =
      screen.queryByRole('dialog') ?? document.querySelector('[data-slot="dialog-content"]')
    expect(dialog).toBeTruthy()
    const button = screen.getByRole('button', { name: '确定' })
    expect(button).toBeTruthy()
    button.focus()
    expect(document.activeElement).toBe(button)
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(dialog).toBeTruthy()
  })

  it('Tooltip 触发器可键盘聚焦', () => {
    render(
      <Tooltip>
        <TooltipTrigger>提示</TooltipTrigger>
        <TooltipContent>说明</TooltipContent>
      </Tooltip>
    )
    const trigger = screen.getByText('提示')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
  })

  it('Select 触发器可键盘聚焦并打开列表', () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger aria-label="状态">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">启用</SelectItem>
          <SelectItem value="b">停用</SelectItem>
        </SelectContent>
      </Select>
    )
    const trigger = screen.getByRole('combobox', { name: '状态' })
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger).toBeTruthy()
  })

  it('Dropdown Menu 触发器可键盘聚焦', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>编辑</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const trigger = screen.getByRole('button', { name: '打开菜单' })
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger).toBeTruthy()
  })

  it('Popover 触发器可键盘聚焦', () => {
    render(
      <Popover>
        <PopoverTrigger>打开说明</PopoverTrigger>
        <PopoverContent>筛选说明</PopoverContent>
      </Popover>
    )
    const trigger = screen.getByRole('button', { name: '打开说明' })
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger).toBeTruthy()
  })
})
