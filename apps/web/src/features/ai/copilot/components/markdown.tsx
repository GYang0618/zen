import { Streamdown } from 'streamdown'

import 'streamdown/styles.css'

export function Markdown({ children }: { children?: string }) {
  return <Streamdown>{children}</Streamdown>
}
