import type { Paginated, PaginationMeta } from './pagination.types'

export interface PaginateParams<T> {
  page: number
  pageSize: number
  /** 统计总条数 */
  count: () => Promise<number>
  /** 根据分页偏移查询数据列表 */
  findMany: (args: { skip: number; take: number }) => Promise<T[]>
}

/**
 * 通用偏移分页执行器：
 * - 并行发起 count 与 findMany
 * - 统一生成 pagination meta
 */
export async function paginate<T>({
  page,
  pageSize,
  count,
  findMany
}: PaginateParams<T>): Promise<Paginated<T>> {
  const skip = (page - 1) * pageSize
  const [total, items] = await Promise.all([count(), findMany({ skip, take: pageSize })])
  return {
    items,
    pagination: buildPaginationMeta(page, pageSize, total)
  }
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0
  }
}
