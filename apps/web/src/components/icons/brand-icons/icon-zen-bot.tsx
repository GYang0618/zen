import { cn } from '@zen/ui'

import type { SVGProps } from 'react'

export function IconZenBot({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('[&>path]:stroke-current', className)}
      {...props}
    >
      <title>Zen Bot</title>
      <path
        d="M1.6 15.0C0.2 9.4 3.3 3.4 9.0 1.6C11.4 0.9 14.0 1.1 16.2 2.1L7.0 11.3H14.3L4.5 21.1C3.1 19.4 2.1 17.3 1.6 15.0Z"
        fill="currentColor"
        fillOpacity="0.14"
      />

      <path
        d="M2.0 15.6C0.4 9.8 3.6 3.5 9.4 1.8C11.9 1.0 14.5 1.3 16.7 2.4L6.6 12.5H17.4L7.4 21.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M22.0 10.8C22.8 16.3 19.3 21.5 13.8 22.6C11.5 23.1 9.3 22.7 7.4 21.8H17.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M19.5 0.5L20.65 3.35L23.5 4.5L20.65 5.65L19.5 8.5L18.35 5.65L15.5 4.5L18.35 3.35L19.5 0.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
