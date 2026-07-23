import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'

import type { Team } from './types'

/** 侧边栏非菜单静态数据（团队切换器等）。导航由路由 staticData 单源生成。 */
export const sidebarChrome = {
  teams: [
    {
      name: 'Zen Admin',
      logo: Command,
      plan: 'Platform'
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise'
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup'
    }
  ] satisfies Team[]
}
