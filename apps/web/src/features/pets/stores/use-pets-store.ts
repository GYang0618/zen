import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_PET_CONFIG } from '../constants/colors'
import { DEFAULT_EYE_PARAMS } from '../constants/emotions'
import { PRESET_PETS } from '../constants/pets-data'

import type { PetConfig, PetEyeParamsMap, PetEyeShape } from '../types'

interface PetsState {
  /** 单只宠物的定制配置表 */
  configs: Record<string, PetConfig>
  /** 全局配置基准（用于批量操作和默认继承） */
  globalConfig: PetConfig
  /** 当前正在侧边抽屉编辑的宠物 ID */
  editingPetId: string | null
  /** 当前正在查看代码弹窗的宠物 ID */
  codePetId: string | null
  /** 搜索关键词 */
  searchQuery: string
  /** 全局眨眼信号计数器 */
  blinkSignal: number

  // Actions
  getPetConfig: (id: string) => PetConfig
  updatePetConfig: (id: string, partial: Partial<PetConfig>) => void
  resetPetConfig: (id: string) => void
  batchUpdateAll: (partial: Partial<PetConfig>) => void
  updateGlobalEyeParam: <K extends PetEyeShape>(
    shape: K,
    key: keyof PetEyeParamsMap[K],
    value: number
  ) => void
  updatePetEyeParam: <K extends PetEyeShape>(
    petId: string,
    shape: K,
    key: keyof PetEyeParamsMap[K],
    value: number
  ) => void
  resetAll: () => void
  setEditingPetId: (id: string | null) => void
  setCodePetId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  triggerGlobalBlink: () => void
}

export const usePetsStore = create<PetsState>()(
  persist(
    (set, get) => ({
      configs: {},
      globalConfig: DEFAULT_PET_CONFIG,
      editingPetId: null,
      codePetId: null,
      searchQuery: '',
      blinkSignal: 0,

      getPetConfig: (id: string) => {
        const custom = get().configs[id]
        if (custom) return custom
        return get().globalConfig
      },

      updatePetConfig: (id: string, partial: Partial<PetConfig>) => {
        set((state) => {
          const current = state.configs[id] ?? state.globalConfig
          return {
            configs: {
              ...state.configs,
              [id]: {
                ...current,
                ...partial
              }
            }
          }
        })
      },

      resetPetConfig: (id: string) => {
        set((state) => {
          const updated = { ...state.configs }
          delete updated[id]
          return { configs: updated }
        })
      },

      batchUpdateAll: (partial: Partial<PetConfig>) => {
        set((state) => {
          const newGlobal = { ...state.globalConfig, ...partial }
          const newConfigs: Record<string, PetConfig> = {}
          for (const pet of PRESET_PETS) {
            const current = state.configs[pet.id] ?? state.globalConfig
            newConfigs[pet.id] = {
              ...current,
              ...partial
            }
          }
          return {
            globalConfig: newGlobal,
            configs: newConfigs
          }
        })
      },

      updateGlobalEyeParam: (shape, key, value) => {
        set((state) => {
          const currentParams = {
            ...DEFAULT_EYE_PARAMS,
            ...(state.globalConfig.eyeParams ?? {})
          }
          const shapeParam = {
            ...currentParams[shape],
            [key]: value
          }
          const updatedParams: PetEyeParamsMap = {
            ...currentParams,
            [shape]: shapeParam
          }
          const newGlobal: PetConfig = {
            ...state.globalConfig,
            eyeParams: updatedParams
          }

          const newConfigs: Record<string, PetConfig> = {}
          for (const pet of PRESET_PETS) {
            const current = state.configs[pet.id] ?? state.globalConfig
            newConfigs[pet.id] = {
              ...current,
              eyeParams: updatedParams
            }
          }

          return {
            globalConfig: newGlobal,
            configs: newConfigs
          }
        })
      },

      updatePetEyeParam: (petId, shape, key, value) => {
        set((state) => {
          const current = state.configs[petId] ?? state.globalConfig
          const currentParams = {
            ...DEFAULT_EYE_PARAMS,
            ...(current.eyeParams ?? {})
          }
          const shapeParam = {
            ...currentParams[shape],
            [key]: value
          }
          const updatedParams: PetEyeParamsMap = {
            ...currentParams,
            [shape]: shapeParam
          }

          return {
            configs: {
              ...state.configs,
              [petId]: {
                ...current,
                eyeParams: updatedParams
              }
            }
          }
        })
      },

      resetAll: () => {
        set({
          configs: {},
          globalConfig: DEFAULT_PET_CONFIG
        })
      },

      setEditingPetId: (id) => set({ editingPetId: id }),
      setCodePetId: (id) => set({ codePetId: id }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      triggerGlobalBlink: () => set((s) => ({ blinkSignal: s.blinkSignal + 1 }))
    }),
    {
      name: 'zen-minimal-pets-config',
      partialize: (state) => ({
        configs: state.configs,
        globalConfig: state.globalConfig
      })
    }
  )
)
