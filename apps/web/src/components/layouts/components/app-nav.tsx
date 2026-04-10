import { NavGroup } from './nav-group'

import type { NavGroup as NavGroupProps } from '../types'

export function AppNav({ items }: { items: NavGroupProps[] }) {
  return (
    <>
      {items.map((props) => (
        <NavGroup key={props.title} {...props} />
      ))}
    </>
  )
}
