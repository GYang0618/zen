import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'

import { CopilotChat } from './components/copilot-chat'
import { CopilotProvider, useCopilot } from './copilot-provider'

export { CopilotProvider, useCopilot }

export function AICopilot() {
  return (
    <CopilotProvider>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed fluid className="flex flex-1 flex-col gap-4 sm:gap-6 p-0">
        <CopilotChat />
      </Main>
    </CopilotProvider>
  )
}
