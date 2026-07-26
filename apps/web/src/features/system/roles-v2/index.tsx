import { AppHeader, Main } from '@/components/layouts'
import { PageHeader } from '@/components/page-header'

export function Roles() {
  return (
    <>
      <AppHeader />

      <Main fixed className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader title="角色管理" description="管理系统中的所有角色" />

        <div className="flex-1 flex gap-4">
          <div className="w-80 h-full border rounded-xl">aisde</div>

          <div className="flex-1 h-full border rounded-xl">main</div>
        </div>
      </Main>
    </>
  )
}
