import axios, { isAxiosError } from 'axios'

import { runPipeline } from './pipeline'

import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { HttpClientConfig } from './types'

export const createHttpClient = (
  config: HttpClientConfig | (() => HttpClientConfig) = {}
): AxiosInstance => {
  const { middlewares = {}, ...cfg } = typeof config === 'function' ? config() : config

  const instance = axios.create(cfg)

  instance.interceptors.request.use(runPipeline(middlewares.request ?? []), (error) =>
    Promise.reject(error)
  )

  instance.interceptors.response.use(runPipeline(middlewares.response ?? []), (error) => {
    if (isAxiosError(error)) {
      return runPipeline(middlewares.error ?? [])(error)
    }
    return Promise.reject(error)
  })

  return instance
}

export const createRequest = (instance: AxiosInstance) => {
  const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
    const response = await instance.request<T, T>(config)
    return response
  }

  const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request<T>({ ...config, method: 'GET', url })

  const post = <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<T> => request<T>({ ...config, data, method: 'POST', url })

  const put = <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T> =>
    request<T>({ ...config, data, method: 'PUT', url })

  const patch = <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<T> => request<T>({ ...config, data, method: 'PATCH', url })

  const del = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request<T>({ ...config, method: 'DELETE', url })

  return {
    delete: del,
    get,
    instance,
    patch,
    post,
    put,
    request
  }
}
