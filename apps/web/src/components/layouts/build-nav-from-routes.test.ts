import { LayoutDashboard, Shield, UserRoundCog } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import {
  buildChildNavLinksFromRouteTree,
  buildNavGroupsFromRouteTree
} from './build-nav-from-routes'

import type { RouteTreeNode } from './build-nav-from-routes'

const tree: RouteTreeNode = {
  fullPath: '/',
  children: [
    {
      fullPath: '',
      id: '/_authenticated',
      children: [
        {
          fullPath: '/',
          id: '/_authenticated/_workbench',
          options: { staticData: { title: '工作台', order: 1 } },
          children: [
            {
              fullPath: '/',
              options: {
                staticData: {
                  title: '概览',
                  order: 1,
                  icon: LayoutDashboard
                }
              }
            }
          ]
        },
        {
          fullPath: '/system',
          id: '/_authenticated/system',
          options: { staticData: { title: '系统', order: 3 } },
          children: [
            {
              fullPath: '/system',
              id: '/_authenticated/system/_identity',
              options: {
                staticData: {
                  title: '身份权限',
                  order: 5,
                  icon: Shield
                }
              },
              children: [
                {
                  fullPath: '/system/users',
                  options: {
                    staticData: {
                      title: '用户管理',
                      order: 10,
                      icon: UserRoundCog,
                      permissions: ['system:user:list']
                    }
                  }
                },
                {
                  fullPath: '/system/roles',
                  options: {
                    staticData: {
                      title: '角色管理',
                      order: 20,
                      permissions: ['system:role:list']
                    }
                  }
                },
                {
                  fullPath: '/system/users/$userId',
                  options: {
                    staticData: {
                      title: '用户详情',
                      hideInMenu: true,
                      permissions: ['system:user:list']
                    }
                  }
                }
              ]
            },
            {
              fullPath: '/system/dict',
              options: {
                staticData: {
                  title: '数据字典',
                  order: 40,
                  permissions: ['system:dict:list']
                }
              }
            }
          ]
        },
        {
          fullPath: '/settings',
          id: '/_authenticated/_other',
          options: { staticData: { title: '其他', order: 100 } },
          children: [
            {
              fullPath: '/settings',
              id: '/_authenticated/_other/settings',
              options: { staticData: { title: '设置', order: 1 } },
              children: [
                {
                  fullPath: '/settings/profile',
                  options: {
                    staticData: {
                      title: '个人资料',
                      order: 10
                    }
                  }
                },
                {
                  fullPath: '/settings/account',
                  options: {
                    staticData: {
                      title: '账户',
                      order: 20
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          fullPath: '/change-password',
          id: '/_authenticated/change-password',
          options: {
            staticData: {
              title: '修改密码',
              hideInMenu: true
            }
          }
        }
      ]
    },
    {
      fullPath: '/errors/404',
      options: { staticData: { title: '404' } }
    }
  ]
}

describe('buildNavGroupsFromRouteTree', () => {
  it('builds group labels from authenticated children and collapsible parents', () => {
    const groups = buildNavGroupsFromRouteTree(tree, [
      'system:user:list',
      'system:role:list',
      'system:dict:list'
    ])

    expect(groups.map((g) => g.title)).toEqual(['工作台', '系统', '其他'])

    const workbench = groups[0]
    expect(workbench?.items).toHaveLength(1)
    expect(workbench?.items[0]).toMatchObject({ title: '概览', url: '/' })

    const system = groups[1]
    expect(system?.items).toHaveLength(2)

    const identity = system?.items[0]
    expect(identity).toMatchObject({ title: '身份权限' })
    expect(identity && 'items' in identity ? identity.items : []).toEqual([
      expect.objectContaining({ title: '用户管理', url: '/system/users' }),
      expect.objectContaining({ title: '角色管理', url: '/system/roles' })
    ])

    expect(system?.items[1]).toMatchObject({
      title: '数据字典',
      url: '/system/dict'
    })

    const other = groups[2]
    expect(other?.items).toEqual([
      expect.objectContaining({
        title: '设置',
        items: [
          expect.objectContaining({ title: '个人资料', url: '/settings/profile' }),
          expect.objectContaining({ title: '账户', url: '/settings/account' })
        ]
      })
    ])
  })

  it('sorts sidebar groups by staticData.order', () => {
    const reordered: RouteTreeNode = {
      fullPath: '/',
      children: [
        {
          fullPath: '',
          id: '/_authenticated',
          children: [
            {
              fullPath: '/settings',
              id: '/_authenticated/_other',
              options: { staticData: { title: '其他', order: 100 } },
              children: [
                {
                  fullPath: '/settings/profile',
                  options: { staticData: { title: '个人资料', order: 10 } }
                }
              ]
            },
            {
              fullPath: '/',
              id: '/_authenticated/_workbench',
              options: { staticData: { title: '工作台', order: 1 } },
              children: [
                {
                  fullPath: '/',
                  options: { staticData: { title: '概览', order: 1 } }
                }
              ]
            },
            {
              fullPath: '/system',
              id: '/_authenticated/system',
              options: { staticData: { title: '系统', order: 3 } },
              children: [
                {
                  fullPath: '/system/dict',
                  options: { staticData: { title: '数据字典', order: 40 } }
                }
              ]
            }
          ]
        }
      ]
    }

    const groups = buildNavGroupsFromRouteTree(reordered, [])
    expect(groups.map((g) => g.title)).toEqual(['工作台', '系统', '其他'])
  })

  it('hides parent when no child passes permission gate', () => {
    const groups = buildNavGroupsFromRouteTree(tree, ['system:dict:list'])
    const system = groups.find((g) => g.title === '系统')
    expect(system?.items).toHaveLength(1)
    expect(system?.items[0]).toMatchObject({ title: '数据字典' })
  })

  it('skips hideInMenu leaves that sit directly under authenticated', () => {
    const groups = buildNavGroupsFromRouteTree(tree, [])
    expect(groups.map((g) => g.title)).toEqual(['工作台', '其他'])
    expect(groups.every((g) => g.title !== '修改密码')).toBe(true)
  })
})

describe('buildChildNavLinksFromRouteTree', () => {
  it('builds ordered flat links from a parent route children', () => {
    const links = buildChildNavLinksFromRouteTree(tree, '/settings', [])

    expect(links).toEqual([
      expect.objectContaining({ title: '个人资料', url: '/settings/profile' }),
      expect.objectContaining({ title: '账户', url: '/settings/account' })
    ])
  })

  it('returns empty when parent route is missing', () => {
    expect(buildChildNavLinksFromRouteTree(tree, '/errors/404', [])).toEqual([])
  })

  it('respects permission gate on child links', () => {
    // pathless layout 与父级共享 fullPath，需用 route id 定位（断言为 AppPath）
    const links = buildChildNavLinksFromRouteTree(
      tree,
      '/_authenticated/system/_identity' as '/system',
      ['system:user:list']
    )

    expect(links).toEqual([expect.objectContaining({ title: '用户管理', url: '/system/users' })])
  })
})
