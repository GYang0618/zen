# Dialog migration

- Previous primitive: Radix Dialog.
- Current primitive: Base UI Dialog with compatibility wrappers for Trigger, Close, Portal, Overlay, Content, Title, and Description.
- Preserved: controlled/uncontrolled open state, focus management, portal behavior, keyboard dismissal, and existing tokens.
- Verification: UI and Web TypeScript checks; runtime behavior remains covered by consumer tests.
