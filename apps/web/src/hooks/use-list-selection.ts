import { useCallback, useMemo, useState } from 'react'

export type ListSelectionState = {
  isSelecting: boolean
  selectedIds: ReadonlySet<string>
}

export const EMPTY_LIST_SELECTION: ListSelectionState = {
  isSelecting: false,
  selectedIds: new Set()
}

export type ListSelectionActionProps = {
  isSelecting?: boolean
  selected?: boolean
  onEnterSelecting?: () => void
  onSelectedChange?: (selected: boolean) => void
}

export function enterListSelecting(state: ListSelectionState): ListSelectionState {
  if (state.isSelecting) return state
  return { ...state, isSelecting: true }
}

export function setListItemSelected(
  state: ListSelectionState,
  id: string,
  selected: boolean
): ListSelectionState {
  const has = state.selectedIds.has(id)
  if (has === selected) {
    return state.isSelecting ? state : { ...state, isSelecting: true }
  }

  const selectedIds = new Set(state.selectedIds)
  if (selected) selectedIds.add(id)
  else selectedIds.delete(id)
  return { isSelecting: true, selectedIds }
}

export function clearListSelection(): ListSelectionState {
  return { isSelecting: false, selectedIds: new Set() }
}

export function selectItemsById<T extends { id: string }>(
  items: T[],
  selectedIds: ReadonlySet<string>
): T[] {
  if (selectedIds.size === 0) return []
  return items.filter((item) => selectedIds.has(item.id))
}

const CHECKBOX_SLOT_SELECTOR = '[data-slot="checkbox"]'

export function shouldToggleCardSelection(target: EventTarget | null): boolean {
  if (target == null || typeof target !== 'object' || !('closest' in target)) return true
  const element = target as { closest: (selector: string) => unknown }
  return element.closest(CHECKBOX_SLOT_SELECTOR) == null
}

export function toggleListItemFromCardClick(
  event: { target: EventTarget | null },
  options: Pick<ListSelectionActionProps, 'isSelecting' | 'selected' | 'onSelectedChange'>
) {
  const { isSelecting, selected = false, onSelectedChange } = options
  if (!isSelecting || !onSelectedChange) return
  if (!shouldToggleCardSelection(event.target)) return
  onSelectedChange(!selected)
}

export function preventSelectionNavigation(
  event: { preventDefault: () => void },
  isSelecting?: boolean
) {
  if (isSelecting) event.preventDefault()
}

export function useListSelection() {
  const [state, setState] = useState<ListSelectionState>(EMPTY_LIST_SELECTION)

  const enterSelecting = useCallback(() => {
    setState(enterListSelecting)
  }, [])

  const setSelected = useCallback((id: string, selected: boolean) => {
    setState((current) => setListItemSelected(current, id, selected))
  }, [])

  const clear = useCallback(() => {
    setState((current) => {
      if (!current.isSelecting && current.selectedIds.size === 0) return current
      return clearListSelection()
    })
  }, [])

  const isSelected = useCallback((id: string) => state.selectedIds.has(id), [state.selectedIds])

  return useMemo(
    () => ({
      isSelecting: state.isSelecting,
      selectedIds: state.selectedIds,
      selectedCount: state.selectedIds.size,
      enterSelecting,
      setSelected,
      clear,
      isSelected
    }),
    [state.isSelecting, state.selectedIds, enterSelecting, setSelected, clear, isSelected]
  )
}
