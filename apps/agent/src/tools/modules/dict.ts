import {
  createDictionarySchema,
  dictionaryListQueryToolSchema,
  updateDictionarySchema,
  workspaceCreateSchema,
  workspaceUpdateSchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  asSdkOptions,
  dictionaryControllerCreateDictionary,
  dictionaryControllerCreateWorkspace,
  dictionaryControllerDeleteDictionary,
  dictionaryControllerDeleteWorkspace,
  dictionaryControllerGetDictionaryDetail,
  dictionaryControllerListDictionaries,
  dictionaryControllerListWorkspaces,
  dictionaryControllerToggleStar,
  dictionaryControllerUpdateDictionary,
  dictionaryControllerUpdateWorkspace,
  executeApiCall
} from '@/api'

const workspaceIdSchema = z.object({
  id: z.string().min(1, '空间 ID 不能为空').describe('空间 ID')
})

const dictionaryIdSchema = z.object({
  id: z.string().min(1, '字典 ID 不能为空').describe('字典 ID')
})

const updateWorkspaceToolSchema = workspaceIdSchema.extend(workspaceUpdateSchema.shape)
const updateDictionaryToolSchema = dictionaryIdSchema.extend(updateDictionarySchema.shape)
const toggleDictionaryStarToolSchema = dictionaryIdSchema.extend({
  isStarred: z.boolean().describe('是否加星标收藏：true=收藏，false=取消收藏')
})

export const queryDictionaryWorkspacesTool = tool(
  async (_input, config) =>
    executeApiCall(config, async (_context) => dictionaryControllerListWorkspaces()),
  {
    name: 'query_dictionary_workspaces',
    description:
      '查询数据字典全部空间列表与统计。stats 含字典总数、收藏数、字典项总数、未归入空间的字典数、kindDistribution、itemStatusDistribution 与 workspaceRanking，可直接绑定环形图和横向条形图。' +
      '创建字典前必须先调用本工具获取合法的空间 folderId，禁止编造 folderId。',
    schema: z.object({})
  }
)

export const createDictionaryWorkspaceTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      dictionaryControllerCreateWorkspace(
        asSdkOptions({
          body: input
        })
      )
    ),
  {
    name: 'create_dictionary_workspace',
    description: '创建新的数据字典空间（分类目录），空间名称不可为空且最多80字符。',
    schema: workspaceCreateSchema
  }
)

export const updateDictionaryWorkspaceTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      dictionaryControllerUpdateWorkspace(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'update_dictionary_workspace',
    description: '更新数据字典空间名称。需提供空间 ID 与新名称。',
    schema: updateWorkspaceToolSchema
  }
)

export const deleteDictionaryWorkspaceTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      dictionaryControllerDeleteWorkspace({
        path: { id }
      })
    ),
  {
    name: 'delete_dictionary_workspace',
    description: '删除指定的数据字典空间。删除前请确认空间下无关键字典或已转移字典。',
    schema: workspaceIdSchema
  }
)

export const queryDictionariesListTool = tool(
  async (input, config) => {
    const { meta: _meta, ...query } = input
    return executeApiCall(config, async (_context) =>
      dictionaryControllerListDictionaries(
        asSdkOptions({
          query
        })
      )
    )
  },
  {
    name: 'query_dictionaries_list',
    description:
      '查询数据字典列表。可按所属空间 ID（支持具体空间 ID、"all" 全部或 "starred" 仅已收藏）、关键字（匹配名称、编码或描述）、性质（business/system）筛选。' +
      '创建新字典前应先查询以避免编码冲突。返回精简列表；完整字典项选项请调用 query_dictionary_detail。' +
      'meta.display 只在用户要看的就是本次返回的这份列表时为 true；取证、归类、统计、为后续办理查数时为 false。',
    schema: dictionaryListQueryToolSchema
  }
)

export const queryDictionaryDetailTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, async (_context) =>
      dictionaryControllerGetDictionaryDetail({
        path: { id }
      })
    ),
  {
    name: 'query_dictionary_detail',
    description:
      '根据字典 ID 查询字典完整详情，包含字典项（选项列表）的名称、键值、描述、排序和启停状态（ACTIVE/DISABLED）。',
    schema: dictionaryIdSchema
  }
)

export const createDictionaryTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      dictionaryControllerCreateDictionary(
        asSdkOptions({
          body: input
        })
      )
    ),
  {
    name: 'create_dictionary',
    description:
      '创建数据字典及其字典项。' +
      '必须提供 folderId（所属空间 ID，先通过 query_dictionary_workspaces 获取），' +
      '编码 code 必须以小写字母开头，仅包含小写字母、数字与下划线（如 biz_order_type），创建后不可修改；' +
      'kind 默认为 business；可同时在 items 中提供初始字典项列表。',
    schema: createDictionarySchema
  }
)

export const updateDictionaryInfoTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      dictionaryControllerUpdateDictionary(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'update_dictionary_info',
    description:
      '更新数据字典基础信息（名称、空间 folderId、性质 kind、描述、收藏状态 isStarred）以及字典项 items。' +
      '注意：字典编码 code 不可修改；若传入 items 则会全量覆盖现有字典项列表，如需保留原字典项请在 items 中包含完整条目。',
    schema: updateDictionaryToolSchema
  }
)

export const toggleDictionaryStarTool = tool(
  async ({ id, isStarred }, config) =>
    executeApiCall(config, () =>
      dictionaryControllerToggleStar(
        asSdkOptions({
          path: { id },
          body: { isStarred }
        })
      )
    ),
  {
    name: 'toggle_dictionary_star',
    description: '快速切换字典的收藏状态（加星标 / 取消收藏）。',
    schema: toggleDictionaryStarToolSchema
  }
)

export const deleteDictionaryTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      dictionaryControllerDeleteDictionary({
        path: { id }
      })
    ),
  {
    name: 'delete_dictionary',
    description: '删除指定数据字典及其全部字典项。该操作为破坏性操作，不可撤销。',
    schema: dictionaryIdSchema
  }
)

export const dictTools = [
  queryDictionaryWorkspacesTool,
  createDictionaryWorkspaceTool,
  updateDictionaryWorkspaceTool,
  deleteDictionaryWorkspaceTool,
  queryDictionariesListTool,
  queryDictionaryDetailTool,
  createDictionaryTool,
  updateDictionaryInfoTool,
  toggleDictionaryStarTool,
  deleteDictionaryTool
] as const
