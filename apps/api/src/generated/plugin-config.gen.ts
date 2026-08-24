/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import type { ZodType } from 'zod'
import { demoNotesConfigSchema } from '@zen/plugin-demo-notes/config'

export const PLUGIN_CONFIG_SCHEMAS = {
  'demo-notes': demoNotesConfigSchema
} as const satisfies Record<string, ZodType>

