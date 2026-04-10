import { type ConfigObject, registerAs } from '@nestjs/config'

import type { Env } from './env.schema'

function toEnv(rawEnv: Record<string, unknown>) {
  return rawEnv as Env
}

export function registerConfig<T extends ConfigObject>(
  namespace: string,
  factory: (env: Env) => T
) {
  return registerAs<T>(namespace, () => factory(toEnv(process.env)))
}
