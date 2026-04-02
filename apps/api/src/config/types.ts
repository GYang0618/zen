import { ConfigType } from '@nestjs/config'
import { CONFIG_NAMESPACES } from './constants'
import {
  appConfig,
  authConfig,
  databaseConfig,
  loggerConfig,
  securityConfig,
  swaggerConfig
} from './modules'

export type AppConfig = ConfigType<typeof appConfig>
export type AuthConfig = ConfigType<typeof authConfig>
export type DatabaseConfig = ConfigType<typeof databaseConfig>
export type LoggerConfig = ConfigType<typeof loggerConfig>
export type SecurityConfig = ConfigType<typeof securityConfig>
export type SwaggerConfig = ConfigType<typeof swaggerConfig>

export type Configs = {
  [CONFIG_NAMESPACES.APP]: AppConfig
  [CONFIG_NAMESPACES.AUTH]: AuthConfig
  [CONFIG_NAMESPACES.DATABASE]: DatabaseConfig
  [CONFIG_NAMESPACES.LOGGER]: LoggerConfig
  [CONFIG_NAMESPACES.SECURITY]: SecurityConfig
  [CONFIG_NAMESPACES.SWAGGER]: SwaggerConfig
}
