import { readFileSync } from 'node:fs'

import { OPENAPI_REQUIRED_MODULE_NAMES } from './openapi-modules.js'

describe('OPENAPI_REQUIRED_MODULE_NAMES', () => {
  it('与 AppModule 业务导入保持同步', () => {
    const appModuleSource = readFileSync(new URL('../app.module.ts', import.meta.url), 'utf8')

    for (const moduleName of OPENAPI_REQUIRED_MODULE_NAMES) {
      expect(appModuleSource).toContain(moduleName)
    }
  })

  it('包含核心业务模块', () => {
    expect(OPENAPI_REQUIRED_MODULE_NAMES).toEqual([
      'SecurityModule',
      'HealthModule',
      'IdentityModule',
      'StorageModule',
      'OrganizationModule',
      'ContentModule',
      'PluginModule',
      'PluginsModule',
      'AgentModule'
    ])
  })
})
