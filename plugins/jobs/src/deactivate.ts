import type { PluginContext } from '@zen/plugin-sdk'

export async function deactivate(ctx: PluginContext): Promise<void> {
  ctx.logger.info('jobs deactivated', { tenantId: ctx.tenantId })
}
