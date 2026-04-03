import type { NavGroup as NavGroupProps } from '../types'
import { NavGroup } from './nav-group'

export function AppNav({ items }: { items: NavGroupProps[] }) {
  return (
    <>
      {items.map((props) => (
        <NavGroup key={props.title} {...props} />
      ))}
    </>
  )
}
