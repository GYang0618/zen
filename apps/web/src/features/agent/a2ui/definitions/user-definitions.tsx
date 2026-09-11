import { userSchema } from '@zen/shared'
import { z } from 'zod'

import type { CatalogDefinitions } from '@copilotkit/a2ui-renderer'

export const userCatalogDefinitions = {
  UserTable: {
    description: '展示用户列表的生成式 UI 表格组件，支持与 Agent 状态双向共享，并支持实时操作。',
    props: z.object({
      title: z.string().optional().describe('表格标题，如“用户列表”'),
      stateKey: z
        .string()
        .optional()
        .describe(
          '在 Agent 共享状态中读取数据的键名，默认优先使用 users，已停用列表为 inactive_users'
        ),
      users: z.array(userSchema).optional().describe('静态传入或初始化时的兜底用户数据'),
      isLoading: z.boolean().optional().describe('是否处于加载/生成中')
    })
  }
} as unknown as CatalogDefinitions

export type UserCatalogDefinitions = typeof userCatalogDefinitions
