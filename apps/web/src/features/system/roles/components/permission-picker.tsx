import { usePermissionsQuery } from '../queries'
import { PermissionMatrix } from './permission-matrix'

type PermissionPickerProps = {
  value: string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
}

/** @deprecated Prefer PermissionMatrix for the master-detail roles UI. */
export function PermissionPicker({ value, onChange, disabled = false }: PermissionPickerProps) {
  const { data: groups = [], isLoading } = usePermissionsQuery(true)

  return (
    <PermissionMatrix
      groups={groups}
      value={value}
      onChange={onChange}
      disabled={disabled}
      isLoading={isLoading}
    />
  )
}
