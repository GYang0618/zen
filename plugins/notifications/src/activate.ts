import type { PluginContext } from '@zen/plugin-sdk'

export async function activate(ctx: PluginContext): Promise<void> {
  ctx.logger.info('notifications activated', { tenantId: ctx.tenantId })
}
