import { catalogDemo } from './catalog-demo'

import type { CatalogDemo } from './catalog-demo'

export const LAYOUT_DEMOS: CatalogDemo[] = [
  catalogDemo(
    'row',
    'Row',
    '横向弹性布局。子项为 Metric，适合并排 KPI。',
    [
      {
        id: 'root',
        component: 'Row',
        gap: 12,
        align: 'stretch',
        children: ['metric-revenue', 'metric-users', 'metric-errors']
      },
      {
        id: 'metric-revenue',
        component: 'Metric',
        label: '本月营收',
        value: '¥128.4万',
        trend: 'up',
        trendValue: '+12.6%',
        description: '较上月',
        icon: 'dollar'
      },
      {
        id: 'metric-users',
        component: 'Metric',
        label: '活跃用户',
        value: '8,920',
        trend: 'up',
        trendValue: '+8.5%',
        description: '近 7 日',
        icon: 'users'
      },
      {
        id: 'metric-errors',
        component: 'Metric',
        label: '错误率',
        value: '0.42%',
        trend: 'down',
        trendValue: '-0.18%',
        description: '较昨日',
        icon: 'activity'
      }
    ],
    'full'
  ),
  catalogDemo('column', 'Column', '纵向布局，子项为 Progress。', [
    {
      id: 'root',
      component: 'Column',
      gap: 16,
      children: ['progress-api', 'progress-storage', 'progress-seats']
    },
    {
      id: 'progress-api',
      component: 'Progress',
      label: 'API 配额',
      value: 72,
      showValue: true
    },
    {
      id: 'progress-storage',
      component: 'Progress',
      label: '对象存储',
      value: 46,
      showValue: true
    },
    {
      id: 'progress-seats',
      component: 'Progress',
      label: '席位占用',
      value: 88,
      showValue: true
    }
  ]),
  catalogDemo('grid', 'Grid', '两列等高网格，子项为 Metric。', [
    {
      id: 'root',
      component: 'Grid',
      columns: 2,
      gap: 12,
      children: ['grid-orders', 'grid-aov', 'grid-refund', 'grid-nps']
    },
    {
      id: 'grid-orders',
      component: 'Metric',
      label: '订单',
      value: '3,482',
      trend: 'up',
      trendValue: '+6.1%',
      icon: 'creditCard'
    },
    {
      id: 'grid-aov',
      component: 'Metric',
      label: '客单价',
      value: '¥368',
      trend: 'neutral',
      trendValue: '0.0%',
      icon: 'dollar'
    },
    {
      id: 'grid-refund',
      component: 'Metric',
      label: '退款率',
      value: '1.8%',
      trend: 'down',
      trendValue: '-0.4%',
      icon: 'activity'
    },
    {
      id: 'grid-nps',
      component: 'Metric',
      label: 'NPS',
      value: '62',
      trend: 'up',
      trendValue: '+3',
      icon: 'users'
    }
  ]),
  catalogDemo(
    'dashboard-card',
    'DashboardCard',
    '给没有自带卡片的内容加标题壳。这里包裹一条进度。',
    [
      {
        id: 'root',
        component: 'DashboardCard',
        title: '发布窗口配额',
        subtitle: '本周已用 3 / 5 次',
        child: 'release-progress'
      },
      {
        id: 'release-progress',
        component: 'Progress',
        label: '冻结窗口占用',
        value: 60,
        showValue: true
      }
    ]
  ),
  catalogDemo('scroll-area', 'ScrollArea', '限定高度的滚动容器，内部是一组 Item。', [
    {
      id: 'root',
      component: 'ScrollArea',
      maxHeight: 220,
      scrollbars: 'vertical',
      children: ['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6']
    },
    {
      id: 'item-1',
      component: 'Item',
      title: '支付回调重试',
      description: 'stripe.webhook 连续失败 3 次',
      icon: 'credit-card',
      badge: 'P1',
      extra: '2 分钟前'
    },
    {
      id: 'item-2',
      component: 'Item',
      title: '搜索索引重建',
      description: '商品索引滞后 14 分钟',
      icon: 'search',
      badge: 'P2',
      extra: '18 分钟前'
    },
    {
      id: 'item-3',
      component: 'Item',
      title: '证书即将到期',
      description: 'api.zen.local 剩余 9 天',
      icon: 'shield-check',
      badge: 'P2',
      extra: '今天'
    },
    {
      id: 'item-4',
      component: 'Item',
      title: '夜间批处理完成',
      description: '账单汇总 12,480 行',
      icon: 'check',
      extra: '03:12'
    },
    {
      id: 'item-5',
      component: 'Item',
      title: '新成员加入',
      description: '林夏加入平台组',
      icon: 'user-plus',
      extra: '昨天'
    },
    {
      id: 'item-6',
      component: 'Item',
      title: '依赖升级',
      description: 'prisma 已升到当前稳定版',
      icon: 'package',
      extra: '昨天'
    }
  ]),
  catalogDemo(
    'tabs',
    'Tabs',
    '标签切换不同子组件：指标、折线和进度。',
    [
      {
        id: 'root',
        component: 'Tabs',
        defaultValue: 'kpi',
        items: [
          { key: 'kpi', label: '指标', icon: 'gauge', child: 'tab-metric' },
          { key: 'trend', label: '趋势', icon: 'trending-up', child: 'tab-line' },
          { key: 'quota', label: '配额', icon: 'list', child: 'tab-progress' }
        ]
      },
      {
        id: 'tab-metric',
        component: 'Metric',
        label: '今日请求',
        value: '1.28M',
        trend: 'up',
        trendValue: '+4.2%',
        icon: 'activity'
      },
      {
        id: 'tab-line',
        component: 'LineChart',
        title: '请求量',
        data: [
          { label: '00', value: 12 },
          { label: '04', value: 8 },
          { label: '08', value: 22 },
          { label: '12', value: 31 },
          { label: '16', value: 28 },
          { label: '20', value: 18 }
        ]
      },
      {
        id: 'tab-progress',
        component: 'Progress',
        label: '当日配额',
        value: 64,
        showValue: true
      }
    ],
    'full'
  )
]

export const PRIMITIVE_DEMOS: CatalogDemo[] = [
  catalogDemo('icon', 'Icon', '按 Lucide 名称渲染图标。', [
    {
      id: 'root',
      component: 'Row',
      gap: 16,
      align: 'center',
      children: ['icon-user', 'icon-shield', 'icon-activity', 'icon-box']
    },
    { id: 'icon-user', component: 'Icon', name: 'user', size: 28 },
    { id: 'icon-shield', component: 'Icon', name: 'shield-check', size: 28 },
    { id: 'icon-activity', component: 'Icon', name: 'activity', size: 28 },
    { id: 'icon-box', component: 'Icon', name: 'boxes', size: 28 }
  ]),
  catalogDemo('avatar', 'Avatar', '三种尺寸，以及角标圆点和角标文案。', [
    {
      id: 'root',
      component: 'Row',
      gap: 16,
      align: 'center',
      children: ['avatar-sm', 'avatar-md', 'avatar-lg', 'avatar-badge']
    },
    { id: 'avatar-sm', component: 'Avatar', name: '林夏', size: 'sm' },
    { id: 'avatar-md', component: 'Avatar', name: '周衡', size: 'default', badge: true },
    { id: 'avatar-lg', component: 'Avatar', name: '陈予', fallback: '予', size: 'lg' },
    { id: 'avatar-badge', component: 'Avatar', name: '平台', fallback: '平', badge: '3' }
  ]),
  catalogDemo('badge', 'Badge', '状态与分类用的轻量标签。', [
    {
      id: 'root',
      component: 'Row',
      gap: 8,
      align: 'center',
      children: ['badge-default', 'badge-secondary', 'badge-outline', 'badge-danger', 'badge-icon']
    },
    { id: 'badge-default', component: 'Badge', text: '进行中' },
    { id: 'badge-secondary', component: 'Badge', text: '草稿', variant: 'secondary' },
    { id: 'badge-outline', component: 'Badge', text: '只读', variant: 'outline' },
    { id: 'badge-danger', component: 'Badge', text: '故障', variant: 'destructive' },
    { id: 'badge-icon', component: 'Badge', text: '已发布', variant: 'outline', icon: 'check' }
  ]),
  catalogDemo('item-group', 'Item · ItemGroup', '信息流条目：图标、说明、徽章和右侧时间。', [
    {
      id: 'root',
      component: 'ItemGroup',
      children: ['member', 'post', 'org']
    },
    {
      id: 'member',
      component: 'Item',
      title: '林夏',
      description: '平台组 · 高级工程师',
      icon: 'user',
      badge: '在职',
      extra: '今天加入'
    },
    {
      id: 'post',
      component: 'Item',
      title: '后端工程师',
      description: 'POS-1008 · P6',
      icon: 'briefcase',
      badge: '在编 6',
      extra: '启用'
    },
    {
      id: 'org',
      component: 'Item',
      title: '平台研发部',
      description: 'ORG-014 · 部门',
      icon: 'building-2',
      extra: '负责人 周衡',
      variant: 'outline'
    }
  ])
]

export const DATA_DEMOS: CatalogDemo[] = [
  catalogDemo(
    'data-table',
    'DataTable',
    '复合单元格、状态标签、头像组、进度和日期列。',
    [
      {
        id: 'root',
        component: 'DataTable',
        title: '核心服务值班表',
        description: '可点击表头排序',
        enableSorting: true,
        columns: [
          {
            key: 'name',
            header: '服务',
            cellType: 'composite',
            subtitleKey: 'code',
            icon: 'server',
            iconColor: 'sky'
          },
          {
            key: 'status',
            header: '状态',
            cellType: 'badge',
            badgeVariantMap: { 正常: 'success', 降级: 'warning', 故障: 'destructive' }
          },
          { key: 'owners', header: '值班', cellType: 'avatarGroup' },
          { key: 'slo', header: 'SLO', cellType: 'progress', align: 'right' },
          { key: 'updatedAt', header: '更新', cellType: 'date' }
        ],
        data: [
          {
            name: 'API Gateway',
            code: 'svc-api',
            status: '正常',
            owners: [{ name: '林夏' }, { name: '周衡' }, { name: '陈予' }],
            slo: 99,
            updatedAt: '2026-10-18'
          },
          {
            name: '支付',
            code: 'svc-pay',
            status: '降级',
            owners: [{ name: '苏晚' }, { name: '何川' }],
            slo: 97,
            updatedAt: '2026-10-20'
          },
          {
            name: '搜索',
            code: 'svc-search',
            status: '故障',
            owners: [{ name: '赵启' }],
            slo: 91,
            updatedAt: '2026-10-21'
          }
        ]
      }
    ],
    'full'
  ),
  catalogDemo('timeline-status', 'Timeline · 状态点', '实心状态点，适合审批和告警流转。', [
    {
      id: 'root',
      component: 'Timeline',
      variant: 'solid-dot',
      items: [
        {
          title: '变更单已提交',
          description: '支付回调超时阈值从 3s 调整为 5s',
          timestamp: '09:12',
          status: 'info',
          side: '申请'
        },
        {
          title: '安全复核通过',
          description: '不涉及密钥与权限扩大',
          timestamp: '09:40',
          status: 'success',
          side: '复核'
        },
        {
          title: '等待发布窗口',
          description: '今晚 22:00 进入冻结窗口',
          timestamp: '10:05',
          status: 'warning',
          side: '发布'
        }
      ]
    }
  ]),
  catalogDemo(
    'timeline-groups',
    'Timeline · 分组',
    '按日期断开连线，组内可混用头像、图标和字段变更。',
    [
      {
        id: 'root',
        component: 'Timeline',
        groups: [
          {
            group: '2026年10月20日',
            items: [
              {
                title: '林夏加入平台组',
                description: '由周衡发起',
                timestamp: '10:16',
                variant: 'avatar',
                avatar: { name: '周衡' },
                side: '成员',
                changes: [{ label: '部门', from: '增长组', to: '平台组' }]
              },
              {
                title: '岗位编制 +1',
                timestamp: '15:02',
                variant: 'icon',
                icon: 'briefcase',
                side: '岗位',
                status: 'success'
              }
            ]
          },
          {
            group: '2026年10月21日',
            items: [
              {
                title: '权限复核',
                description: '移除生产库直连',
                timestamp: '09:28',
                variant: 'icon',
                icon: 'shield-check',
                side: '权限',
                status: 'info',
                actions: [{ label: '查看差异', variant: 'outline' }]
              }
            ]
          }
        ]
      }
    ],
    'full'
  )
]

export const ENTITY_DEMOS: CatalogDemo[] = [
  catalogDemo('user-card', 'UserCard', '用户实体卡：头像、账号、状态、部门岗位与角色。', [
    {
      id: 'root',
      component: 'UserCard',
      user: {
        id: 'user-lin',
        username: 'linxia',
        nickname: '林夏',
        realName: '林夏',
        email: 'linxia@zen.local',
        status: 'active',
        departmentName: '平台研发部',
        postName: '高级工程师',
        roles: [
          { id: 'role-dev', code: 'developer', name: '研发', icon: 'shield', iconColor: 'sky' },
          { id: 'role-oncall', code: 'oncall', name: '值班', icon: 'users', iconColor: 'amber' }
        ]
      }
    }
  ]),
  catalogDemo('role-card', 'RoleCard', '角色实体卡：图标、派生状态、成员数与权限数。', [
    {
      id: 'root',
      component: 'RoleCard',
      role: {
        id: 'role-admin',
        code: 'platform_admin',
        name: '平台管理员',
        description: '管理组织、角色与审计配置，不能删除系统数据。',
        icon: 'shield-check',
        iconColor: 'indigo',
        status: 'active',
        effectiveStatus: 'locked',
        kind: 'system',
        memberCount: 4,
        permissionCount: 36,
        isSystem: true
      }
    }
  ]),
  catalogDemo('post-card', 'PostCard', '岗位实体卡：职级、启用状态、在编人数与关联组织。', [
    {
      id: 'root',
      component: 'PostCard',
      item: {
        id: 'post-be',
        code: 'POS-1008',
        name: '后端工程师',
        level: 'P6',
        status: 'active',
        icon: 'code-2',
        iconColor: 'sky',
        activeCount: 6,
        frozenCount: 1,
        organizationCount: 2
      }
    }
  ]),
  catalogDemo('organization-card', 'OrganizationCard', '组织实体卡：类型、负责人与编制统计。', [
    {
      id: 'root',
      component: 'OrganizationCard',
      organization: {
        id: 'org-platform',
        code: 'ORG-014',
        name: '平台研发部',
        type: 'department',
        leader: { id: 'user-zhou', name: '周衡', title: '负责人' },
        memberCount: 18,
        positionCount: 5,
        effectiveDate: '2024-03-01'
      }
    }
  ])
]
