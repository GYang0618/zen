/** 当前平台版本（Manifest.platformVersion 需兼容） */
export const PLATFORM_VERSION = '0.1.0'

/** 插件目录相对 monorepo 根 */
export const PLUGINS_GLOB_DIR = 'plugins'

/** Manifest 文件名 */
export const PLUGIN_MANIFEST_FILENAME = 'zen.plugin.json'

/** 权限码命名：module:resource:action */
export const PLUGIN_PERMISSION_CODE_PATTERN =
  /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/

/** 内核保留前缀，插件不得贡献 */
export const KERNEL_PERMISSION_PREFIX = 'system:'

/** Nest PermissionGuard 读取的 metadata key（插件与平台必须一致） */
export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions'

/** Nest PluginActiveGuard 读取的 metadata key */
export const REQUIRE_PLUGIN_ID_KEY = 'requirePluginId'
