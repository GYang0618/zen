import { ConfigDrawer } from '@/components/config-drawer'
import { Header, Main, TopNav } from '@/components/layouts'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export function Dashboard() {
  const topNav = [
    {
      title: '仪表盘',
      href: 'dashboard/overview',
      isActive: true,
      disabled: false
    },
    {
      title: '顾客',
      href: 'dashboard/customers',
      isActive: false,
      disabled: true
    },
    {
      title: '产品',
      href: 'dashboard/products',
      isActive: false,
      disabled: true
    },
    {
      title: '设置',
      href: 'dashboard/settings',
      isActive: false,
      disabled: true
    }
  ]
  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          {/* <ProfileDropdown /> */}
        </div>
      </Header>
      <Main>仪表盘</Main>
    </>
  )
}
