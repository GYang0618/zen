import { cn } from '@zen/ui'

import type { SVGProps } from 'react'

export function IconZen({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <title>Zen</title>
      <path
        d="M1 6.2C1 3.328 3.328 1 6.2 1H18.8L6.2 13.6H17.8C20.672 13.6 23 15.928 23 18.8C23 21.672 20.672 23 17.8 23H5.2L17.8 10.4H6.2C3.328 10.4 1 8.52 1 6.2Z"
        fill="currentColor"
        fillOpacity="0.12"
      />

      <path
        d="M1.6 15.2V5.6C1.6 3.39086 3.39086 1.6 5.6 1.6H19.6L4.4 16.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M22.4 8.8V18.4C22.4 20.6091 20.6091 22.4 18.4 22.4H4.4L19.6 7.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
