import * as BaseUI from '@base-ui/react'
import * as React from 'react'

type AnyProps = Record<string, any>
type PropsOf<C extends React.ElementType> = React.ComponentPropsWithoutRef<C>

function mergeSlotProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps }
  for (const key of Object.keys(childProps)) {
    if (key === 'children' || key === 'ref') continue
    const slotValue = slotProps[key]
    const childValue = childProps[key]
    if (key === 'className') {
      merged.className = [slotValue, childValue].filter(Boolean).join(' ')
    } else if (key === 'style' && slotValue && childValue) {
      merged.style = { ...slotValue, ...childValue }
    } else if (
      key.startsWith('on') &&
      typeof slotValue === 'function' &&
      typeof childValue === 'function'
    ) {
      merged[key] = (...args: unknown[]) => {
        childValue(...args)
        slotValue(...args)
      }
    } else if (childValue !== undefined) {
      merged[key] = childValue
    }
  }
  return merged
}

function mergeSlotChild(child: React.ReactElement<any>, slotProps: AnyProps, ref: React.Ref<any>) {
  return React.cloneElement(child, { ...mergeSlotProps(slotProps, child.props), ref })
}

function native(tag: keyof React.JSX.IntrinsicElements) {
  return React.forwardRef<any, AnyProps>((props, ref) => {
    const { asChild, render, children, ...rest } = props
    if (React.isValidElement(render)) return mergeSlotChild(render, rest, ref)
    if (asChild && React.isValidElement(children)) return mergeSlotChild(children, rest, ref)
    return React.createElement(tag, { ...rest, ref }, children)
  })
}

const SlotRoot = React.forwardRef<any, AnyProps>((props, ref) => {
  const { asChild: _asChild, render, children, ...rest } = props
  const target = React.isValidElement(render)
    ? render
    : React.isValidElement(children)
      ? children
      : null
  if (target) return mergeSlotChild(target, rest, ref)
  return React.createElement('span', { ...rest, ref }, children)
})
SlotRoot.displayName = 'Slot'

function withRender(Component: any) {
  return React.forwardRef<any, AnyProps>((props, ref) => {
    const { asChild, children, ...rest } = props
    if (asChild && React.isValidElement(children))
      return React.createElement(Component, { ...rest, ref, render: children })
    return React.createElement(Component, { ...rest, ref }, children)
  })
}

function positioned(Component: any, Positioner: any) {
  return React.forwardRef<any, AnyProps>((props, ref) => {
    const {
      align,
      side,
      sideOffset,
      alignOffset,
      anchor,
      position,
      alignItemWithTrigger,
      forceMount: _forceMount,
      children,
      ...rest
    } = props
    const resolvedAlignItemWithTrigger =
      alignItemWithTrigger ??
      (position === 'popper' ? false : position === 'item-aligned' ? true : undefined)
    return React.createElement(
      Positioner,
      {
        align,
        side,
        sideOffset,
        alignOffset,
        anchor,
        className: 'isolate z-50 outline-none',
        ...(resolvedAlignItemWithTrigger === undefined
          ? null
          : { alignItemWithTrigger: resolvedAlignItemWithTrigger })
      },
      React.createElement(Component, { ...rest, ref }, children)
    )
  })
}

type OpenChangeProps = { onOpenChange?: (open: boolean) => void }
type BivariantCallback<Value> = { bivarianceHack(value: Value): void }['bivarianceHack']
type StringValueProps<Value extends string = string> = {
  value?: Value
  defaultValue?: Value
  onValueChange?: BivariantCallback<Value>
}

function openChangeRoot<P extends object>(Component: any) {
  return React.forwardRef<any, Omit<P, 'onOpenChange'> & OpenChangeProps & { asChild?: boolean }>(
    (props, ref) => {
      const { onOpenChange, asChild: _asChild, ...rest } = props as AnyProps
      return React.createElement(Component, {
        ...rest,
        ref,
        onOpenChange: onOpenChange ? (open: boolean) => onOpenChange(open) : undefined
      })
    }
  )
}

const DialogRoot = openChangeRoot<PropsOf<typeof BaseUI.Dialog.Root>>(BaseUI.Dialog.Root)
const AlertDialogRoot = openChangeRoot<PropsOf<typeof BaseUI.AlertDialog.Root>>(
  BaseUI.AlertDialog.Root
)
const PopoverRoot = openChangeRoot<PropsOf<typeof BaseUI.Popover.Root>>(BaseUI.Popover.Root)
const MenuRoot = openChangeRoot<PropsOf<typeof BaseUI.Menu.Root>>(BaseUI.Menu.Root)
const TooltipRoot = openChangeRoot<PropsOf<typeof BaseUI.Tooltip.Root>>(BaseUI.Tooltip.Root)
const CollapsibleRoot = React.forwardRef<
  any,
  Omit<PropsOf<typeof BaseUI.Collapsible.Root>, 'onOpenChange'> &
    OpenChangeProps & { asChild?: boolean }
>((props, ref) => {
  const { onOpenChange, asChild, children, ...rest } = props as AnyProps
  const render = asChild && React.isValidElement(children) ? children : undefined
  return React.createElement(BaseUI.Collapsible.Root as any, {
    ...rest,
    ref,
    ...(render ? { render } : { children }),
    onOpenChange: onOpenChange ? (open: boolean) => onOpenChange(open) : undefined
  })
})

const SelectRoot = React.forwardRef<
  any,
  Omit<PropsOf<typeof BaseUI.Select.Root>, 'onValueChange' | 'onOpenChange'> & {
    onValueChange?: (value: string) => void
    onOpenChange?: (open: boolean) => void
  }
>((props, ref) => {
  const { onValueChange, onOpenChange, ...rest } = props
  return React.createElement(BaseUI.Select.Root as any, {
    ...rest,
    ref,
    onValueChange: onValueChange
      ? (value: string | null) => {
          if (value !== null) onValueChange(value)
        }
      : undefined,
    onOpenChange: onOpenChange ? (open: boolean) => onOpenChange(open) : undefined
  })
})

type CheckboxState = boolean | 'indeterminate'

const CheckboxRoot = React.forwardRef<
  any,
  Omit<PropsOf<typeof BaseUI.Checkbox.Root>, 'onCheckedChange' | 'checked' | 'defaultChecked'> & {
    checked?: CheckboxState
    defaultChecked?: CheckboxState
    onCheckedChange?: (checked: CheckboxState) => void
  }
>((props, ref) => {
  const { onCheckedChange, ...rest } = props
  return React.createElement(BaseUI.Checkbox.Root as any, {
    ...rest,
    checked: props.checked === 'indeterminate' ? false : props.checked,
    defaultChecked: props.defaultChecked === 'indeterminate' ? false : props.defaultChecked,
    ref,
    onCheckedChange: onCheckedChange ? (checked: boolean) => onCheckedChange(checked) : undefined
  })
})

const SwitchRoot = React.forwardRef<
  any,
  Omit<PropsOf<typeof BaseUI.Switch.Root>, 'onCheckedChange'> & {
    onCheckedChange?: (checked: boolean) => void
  }
>((props, ref) => {
  const { onCheckedChange, ...rest } = props
  return React.createElement(BaseUI.Switch.Root as any, {
    ...rest,
    ref,
    onCheckedChange: onCheckedChange ? (checked: boolean) => onCheckedChange(checked) : undefined
  })
})

function RadioGroupRoot<Value extends string = string>(
  props: React.HTMLAttributes<HTMLDivElement> & {
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    name?: string
    form?: string
  } & StringValueProps<Value>
) {
  const { onValueChange, ...rest } = props
  return React.createElement(BaseUI.RadioGroup as any, {
    ...rest,
    onValueChange: onValueChange ? (value: Value) => onValueChange(value) : undefined
  })
}

function TabsRoot(
  props: Omit<AnyProps, 'onValueChange'> & {
    value?: string
    defaultValue?: string
    onValueChange?: BivariantCallback<string>
  }
) {
  const { onValueChange, ...rest } = props
  return React.createElement(BaseUI.Tabs.Root as any, {
    ...rest,
    onValueChange: onValueChange ? (value: string) => onValueChange(value) : undefined
  })
}

const MenuCheckboxItem = React.forwardRef<
  any,
  Omit<PropsOf<typeof BaseUI.Menu.CheckboxItem>, 'onCheckedChange'> & {
    onCheckedChange?: (checked: boolean) => void
  }
>((props, ref) => {
  const { onCheckedChange, ...rest } = props
  return React.createElement(BaseUI.Menu.CheckboxItem as any, {
    ...rest,
    ref,
    onCheckedChange: onCheckedChange ? (checked: boolean) => onCheckedChange(checked) : undefined
  })
})

const NativeLabel = native('label')
const NativeDiv = native('div')
const NativeSpan = native('span')
const Slot = { Root: SlotRoot }
const Label = { Root: NativeLabel }
const Direction = {
  DirectionProvider: NativeDiv,
  Provider: NativeDiv,
  useDirection: () => 'ltr' as const
}
const Dialog = {
  Root: DialogRoot,
  Trigger: withRender(BaseUI.Dialog.Trigger),
  Portal: BaseUI.Dialog.Portal as any,
  Close: withRender(BaseUI.Dialog.Close),
  Overlay: BaseUI.Dialog.Backdrop as any,
  Content: BaseUI.Dialog.Popup as any,
  Title: withRender(BaseUI.Dialog.Title),
  Description: withRender(BaseUI.Dialog.Description)
}
const AlertDialog = {
  Root: AlertDialogRoot,
  Trigger: withRender(BaseUI.AlertDialog.Trigger),
  Portal: BaseUI.AlertDialog.Portal as any,
  Close: withRender(BaseUI.AlertDialog.Close),
  Cancel: withRender(BaseUI.AlertDialog.Close),
  Action: withRender(BaseUI.AlertDialog.Close),
  Overlay: BaseUI.AlertDialog.Backdrop as any,
  Content: BaseUI.AlertDialog.Popup as any,
  Title: withRender(BaseUI.AlertDialog.Title),
  Description: withRender(BaseUI.AlertDialog.Description)
}
const Popover = {
  Root: PopoverRoot,
  Trigger: withRender(BaseUI.Popover.Trigger),
  Portal: BaseUI.Popover.Portal as any,
  Content: positioned(BaseUI.Popover.Popup, BaseUI.Popover.Positioner),
  Anchor: native('span')
}
const Select = {
  Root: SelectRoot,
  Group: BaseUI.Select.Group as any,
  Value: BaseUI.Select.Value as any,
  Trigger: withRender(BaseUI.Select.Trigger),
  Icon: withRender(BaseUI.Select.Icon),
  Portal: BaseUI.Select.Portal as any,
  Content: positioned(BaseUI.Select.Popup, BaseUI.Select.Positioner),
  Viewport: BaseUI.Select.List as any,
  Label: BaseUI.Select.GroupLabel as any,
  Item: withRender(BaseUI.Select.Item),
  ItemIndicator: BaseUI.Select.ItemIndicator as any,
  ItemText: BaseUI.Select.ItemText as any,
  Separator: BaseUI.Select.Separator as any,
  ScrollUpButton: BaseUI.Select.ScrollUpArrow as any,
  ScrollDownButton: BaseUI.Select.ScrollDownArrow as any
}
const DropdownMenu = {
  Root: MenuRoot,
  Portal: BaseUI.Menu.Portal as any,
  Trigger: withRender(BaseUI.Menu.Trigger),
  Content: positioned(BaseUI.Menu.Popup, BaseUI.Menu.Positioner),
  Group: BaseUI.Menu.Group as any,
  Label: BaseUI.Menu.GroupLabel as any,
  Item: withRender(BaseUI.Menu.Item),
  CheckboxItem: MenuCheckboxItem,
  RadioItem: withRender(BaseUI.Menu.RadioItem),
  RadioGroup: BaseUI.Menu.RadioGroup as any,
  ItemIndicator: BaseUI.Menu.CheckboxItemIndicator as any,
  Separator: BaseUI.Menu.Separator as any,
  Sub: BaseUI.Menu.SubmenuRoot as any,
  SubTrigger: withRender(BaseUI.Menu.SubmenuTrigger),
  SubContent: positioned(BaseUI.Menu.Popup, BaseUI.Menu.Positioner)
}
const Tabs = {
  Root: TabsRoot,
  List: BaseUI.Tabs.List as any,
  Trigger: BaseUI.Tabs.Tab as any,
  Content: BaseUI.Tabs.Panel as any
}
const Tooltip = {
  Provider: BaseUI.Tooltip.Provider as any,
  Root: TooltipRoot,
  Trigger: withRender(BaseUI.Tooltip.Trigger),
  Portal: BaseUI.Tooltip.Portal as any,
  Content: positioned(BaseUI.Tooltip.Popup, BaseUI.Tooltip.Positioner),
  Arrow: BaseUI.Tooltip.Arrow as any
}
const Checkbox = { Root: CheckboxRoot, Indicator: BaseUI.Checkbox.Indicator as any }
const Switch = { Root: SwitchRoot, Thumb: BaseUI.Switch.Thumb as any }
const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: withRender(BaseUI.Collapsible.Trigger),
  Content: BaseUI.Collapsible.Panel as any,
  CollapsibleTrigger: withRender(BaseUI.Collapsible.Trigger),
  CollapsibleContent: BaseUI.Collapsible.Panel as any
}
const ScrollArea = {
  Root: BaseUI.ScrollArea.Root as any,
  Viewport: BaseUI.ScrollArea.Viewport as any,
  ScrollAreaScrollbar: BaseUI.ScrollArea.Scrollbar as any,
  ScrollAreaThumb: BaseUI.ScrollArea.Thumb as any,
  Corner: BaseUI.ScrollArea.Corner as any
}
const Avatar = {
  Root: BaseUI.Avatar.Root as any,
  Image: BaseUI.Avatar.Image as any,
  Fallback: BaseUI.Avatar.Fallback as any
}
const Progress = {
  Root: (props: AnyProps) => <BaseUI.Progress.Root value={props.value ?? 0} {...props} />,
  Indicator: BaseUI.Progress.Indicator as any
}
const Separator = {
  Root: (props: AnyProps) => {
    const { decorative: _decorative, ...rest } = props
    return <BaseUI.Separator {...rest} />
  }
}
const RadioGroup = {
  Root: RadioGroupRoot,
  Item: BaseUI.Radio.Root as any,
  Indicator: BaseUI.Radio.Indicator as any
}

export {
  AlertDialog,
  Avatar,
  Checkbox,
  Collapsible,
  Dialog,
  Direction,
  DropdownMenu,
  Label,
  NativeDiv,
  NativeSpan,
  Popover,
  Progress,
  RadioGroup,
  ScrollArea,
  Select,
  Separator,
  Slot,
  Switch,
  Tabs,
  Tooltip
}
