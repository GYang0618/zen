/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */

import { demoNotesConfigSchema } from '@zen/plugin-demo-notes/config'

import type { ZodType } from 'zod'

export const PLUGIN_CONFIG_SCHEMAS = {
  'demo-notes': demoNotesConfigSchema
} as const satisfies Record<string, ZodType>

export type PluginConfigSchemaId = keyof typeof PLUGIN_CONFIG_SCHEMAS
