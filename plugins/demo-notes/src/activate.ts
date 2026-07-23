import type { PluginContext } from '@zen/plugin-sdk'

export async function activate(ctx: PluginContext): Promise<void> {
  ctx.logger.info('demo-notes activated', { tenantId: ctx.tenantId })
}
