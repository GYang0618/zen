type Config = Record<string, object>

export type ConfigOptions<T extends Config> = Array<{ value: keyof T } & T[keyof T]>

export const toOptions = <T extends Config>(config: T): ConfigOptions<T> => {
  return Object.keys(config).map((value: keyof T) => ({
    value,
    ...config[value]
  }))
}

export const getConfig = <T extends Config>(config: T, value: keyof T) => config[value]
