import { Outlet } from '@tanstack/react-router'

export function AuthLayout() {
  return (
    <div className="h-svh w-full bg-primary-foreground flex items-center justify-center p-6 md:p-10">
      <Outlet />
    </div>
  )
}
