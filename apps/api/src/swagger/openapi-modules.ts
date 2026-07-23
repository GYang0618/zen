/**
 * OpenAPI 覆盖清单：必须与 AppModule 中业务 Module 导入保持同步。
 * 新增业务 Module 时同时更新本列表与 AppModule。
 */
export const OPENAPI_REQUIRED_MODULE_NAMES = [
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
] as const

export type OpenApiRequiredModuleName = (typeof OPENAPI_REQUIRED_MODULE_NAMES)[number]
