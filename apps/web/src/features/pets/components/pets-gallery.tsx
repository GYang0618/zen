import { useMemo } from 'react'

import { PRESET_PETS } from '../constants/pets-data'
import { usePetsStore } from '../stores/use-pets-store'
import { PetCard } from './pet-card'
import { PetCodeModal } from './pet-code-modal'
import { PetEditSheet } from './pet-edit-sheet'
import { PetsGlobalToolbar } from './pets-global-toolbar'
import { PetsHeader } from './pets-header'

export function PetsGallery() {
  const configs = usePetsStore((s) => s.configs)
  const globalConfig = usePetsStore((s) => s.globalConfig)
  const searchQuery = usePetsStore((s) => s.searchQuery)

  const customizedCount = Object.keys(configs).length

  // 搜索过滤
  const filteredPets = useMemo(() => {
    if (!searchQuery.trim()) return PRESET_PETS
    const query = searchQuery.toLowerCase().trim()
    return PRESET_PETS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.chineseName.toLowerCase().includes(query) ||
        p.number.toLowerCase().includes(query) ||
        p.tag.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* 顶部标题栏与全局操作 */}
      <PetsHeader totalCount={PRESET_PETS.length} customizedCount={customizedCount} />

      {/* 原型级全局快速调配栏（支持批量编辑全部宠物） */}
      <PetsGlobalToolbar />

      {/* 20只宠物画廊网格 */}
      {filteredPets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} config={configs[pet.id] ?? globalConfig} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-8 text-center">
          <p className="text-sm font-medium text-foreground">没有找到匹配的宠物</p>
          <p className="mt-1 text-xs text-muted-foreground">请尝试输入其他关键词检索</p>
        </div>
      )}

      {/* 单个宠物独立编辑抽屉 */}
      <PetEditSheet />

      {/* SVG 源码提取弹窗 */}
      <PetCodeModal />
    </div>
  )
}
