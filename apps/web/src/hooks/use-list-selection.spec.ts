import { describe, expect, it } from 'vitest'

import {
  clearListSelection,
  EMPTY_LIST_SELECTION,
  enterListSelecting,
  preventSelectionNavigation,
  selectItemsById,
  setListItemSelected,
  shouldToggleCardSelection
} from './use-list-selection'

describe('list selection', () => {
  it('enters selecting mode without checking any item', () => {
    const next = enterListSelecting(EMPTY_LIST_SELECTION)

    expect(next.isSelecting).toBe(true)
    expect(next.selectedIds.size).toBe(0)
  })

  it('checks an item and keeps selecting mode', () => {
    const selecting = enterListSelecting(EMPTY_LIST_SELECTION)
    const next = setListItemSelected(selecting, 'role-1', true)

    expect(next.isSelecting).toBe(true)
    expect([...next.selectedIds]).toEqual(['role-1'])
  })

  it('clears selection and exits selecting mode', () => {
    const selected = setListItemSelected(EMPTY_LIST_SELECTION, 'role-1', true)
    const next = clearListSelection()

    expect(selected.selectedIds.has('role-1')).toBe(true)
    expect(next).toEqual(EMPTY_LIST_SELECTION)
  })
})

describe('selectItemsById', () => {
  const items = [
    { id: 'a', name: '岗位 A' },
    { id: 'b', name: '岗位 B' },
    { id: 'c', name: '岗位 C' }
  ]

  it('returns the selected subset in original order', () => {
    expect(selectItemsById(items, new Set(['c', 'a']))).toEqual([
      { id: 'a', name: '岗位 A' },
      { id: 'c', name: '岗位 C' }
    ])
  })

  it('returns an empty list when nothing is selected', () => {
    expect(selectItemsById(items, new Set())).toEqual([])
  })

  it('ignores ids that are not in the current page', () => {
    expect(selectItemsById(items, new Set(['missing', 'b']))).toEqual([{ id: 'b', name: '岗位 B' }])
  })
})

describe('shouldToggleCardSelection', () => {
  it('ignores clicks on the checkbox control', () => {
    const checkbox = {
      closest: (selector: string) => (selector === '[data-slot="checkbox"]' ? checkbox : null)
    } as unknown as Element

    expect(shouldToggleCardSelection(checkbox)).toBe(false)
  })

  it('allows clicks on the rest of the card', () => {
    const title = {
      closest: () => null
    } as unknown as Element

    expect(shouldToggleCardSelection(title)).toBe(true)
  })
})

describe('preventSelectionNavigation', () => {
  it('blocks navigation only while selecting', () => {
    const selecting = {
      prevented: false,
      preventDefault() {
        this.prevented = true
      }
    }
    const browsing = {
      prevented: false,
      preventDefault() {
        this.prevented = true
      }
    }

    preventSelectionNavigation(selecting, true)
    preventSelectionNavigation(browsing, false)

    expect(selecting.prevented).toBe(true)
    expect(browsing.prevented).toBe(false)
  })
})
