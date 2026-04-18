import { createContext, useContext } from 'react'

export type Direction = 'ltr' | 'rtl'

const DirectionContext = createContext<Direction>('ltr')

export function DirectionProvider({
  value,
  children
}: {
  value: Direction
  children: React.ReactNode
}) {
  return <DirectionContext value={value}>{children}</DirectionContext>
}

export function useDirection() {
  return useContext(DirectionContext)
}
