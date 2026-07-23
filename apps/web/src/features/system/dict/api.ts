import { request } from '@/lib/request'

import type { CreateDictItem, CreateDictType, DictItem, DictType } from '@zen/shared'

export const dictApi = {
  list: () => request.get<DictType[]>('/dict'),
  createType: (data: CreateDictType) => request.post<DictType, CreateDictType>('/dict/types', data),
  createItem: (data: CreateDictItem) => request.post<DictItem, CreateDictItem>('/dict/items', data)
}
