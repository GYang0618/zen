import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { OPENAPI_REQUIRED_MODULE_NAMES } from './openapi-modules'

describe('OPENAPI_REQUIRED_MODULE_NAMES', () => {
  it('与 AppModule 业务导入保持同步', () => {
    const appModuleSource = readFileSync(join(__dirname, '../app.module.ts'), 'utf8')

    for (const moduleName of OPENAPI_REQUIRED_MODULE_NAMES) {
      expect(appModuleSource).toContain(moduleName)
    }
  })

  it('包含核心业务模块', () => {
    expect(OPENAPI_REQUIRED_MODULE_NAMES).toEqual([
      'AuthModule',
      'HealthModule',
      'UserModule',
      'RoleModule',
      'OrganizationModule',
      'DictModule',
      'AuditModule',
      'SystemConfigModule',
      'PluginModule',
      'PluginsModule',
      'ChatModule',
      'CopilotModule'
    ])
  })
})
