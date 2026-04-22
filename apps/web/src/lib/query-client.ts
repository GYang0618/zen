import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** 数据“新鲜”时长（在此时间内不自动重取） */
      staleTime: 5 * 60 * 1000, // 5 分钟（后台项目最常用）
      /** 缓存保留时长（不活跃后多久被垃圾回收） */
      gcTime: 10 * 60 * 1000, // 10 分钟
      /** 失败自动重试次数 */
      retry: 3,
      /** 窗口/标签重新获得焦点时是否自动重取 */
      refetchOnWindowFocus: false,
      /** 组件挂载时是否重取 */
      refetchOnMount: true,
      /** 网络重连时是否重取 */
      refetchOnReconnect: true,
      /** 可选：指数退避重试延迟（更友好） */
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      /** 变更操作重试次数（通常比 queries 少） */
      retry: 1
    }
  }
})
