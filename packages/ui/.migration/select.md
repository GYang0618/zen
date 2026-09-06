# Select migration

- Previous primitive: Radix Select.
- Current primitive: Base UI Select and Positioner.
- Preserved: item/value composition, controlled values, null-safe value changes, item-aligned/popper positioning, scrolling controls, and keyboard interaction.
- Compatibility: Radix-only `position` and `forceMount` fields are consumed by the adapter and are not forwarded to Base UI.
- Verification: UI and Web TypeScript checks.
