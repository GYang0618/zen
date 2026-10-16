import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_EYE_PARAMS } from '@/features/pets'

import type { PetEmotion, PetEyeParamsMap, PetEyeShape } from '@/features/pets'

export type PetBehaviorMode = 'random' | 'fixed'

export interface ScenarioEmotions {
  idle: PetEmotion // 待机常态表情（固定模式下生效，随机模式下作为基准）
  hover: PetEmotion // 鼠标悬停表情
  open: PetEmotion // 对话窗口打开表情
  drag: PetEmotion // 拖拽移动表情
  running: PetEmotion // AI 思考/执行任务表情
  tucked: PetEmotion // 贴边半隐藏休眠表情
}

export const DEFAULT_SCENARIO_EMOTIONS: ScenarioEmotions = {
  idle: 'normal',
  hover: 'happy',
  open: 'normal',
  drag: 'dizzy',
  running: 'wink',
  tucked: 'sleep'
}

interface AgentPetState {
  /** 宠物形态（默认 orb 球团，持久化） */
  shape: string
  /** 眼睛形状底胚（持久化） */
  eyeShape: PetEyeShape
  /** 眼睛模式：固定选定眼型 vs 随机变幻眼型 */
  eyeShapeMode: PetBehaviorMode
  /** 眼睛细化参数表（持久化） */
  eyeParams: PetEyeParamsMap
  /** 表情模式：固定单表情 vs 待机 10-15s 随机轮换 */
  emotionMode: PetBehaviorMode
  /** 各场景下的定制表情 */
  scenarioEmotions: ScenarioEmotions
  /** 临时表情预览（用于即时反馈，不持久化） */
  previewEmotion: PetEmotion | null
  /** 变更信号（每次编辑时递增，唤醒全站悬浮球实时反馈，不持久化） */
  changeSignal: number

  setShape: (shape: string) => void
  setEyeShape: (shape: PetEyeShape) => void
  setEyeShapeMode: (mode: PetBehaviorMode) => void
  setEyeParam: <K extends PetEyeShape>(
    shape: K,
    key: keyof PetEyeParamsMap[K],
    value: number
  ) => void
  resetEyeParams: (shape?: PetEyeShape) => void
  setEmotionMode: (mode: PetBehaviorMode) => void
  setScenarioEmotion: (scenario: keyof ScenarioEmotions, emotion: PetEmotion) => void
  resetScenarioEmotions: () => void
  resetToDefaults: () => void
  setPreviewEmotion: (emotion: PetEmotion | null) => void
}

export const DEFAULT_AGENT_PET_SHAPE = 'orb'
export const DEFAULT_AGENT_PET_EYE_SHAPE: PetEyeShape = 'capsule'

export const useAgentPetStore = create<AgentPetState>()(
  persist(
    (set) => ({
      shape: DEFAULT_AGENT_PET_SHAPE,
      eyeShape: DEFAULT_AGENT_PET_EYE_SHAPE,
      eyeShapeMode: 'fixed',
      eyeParams: DEFAULT_EYE_PARAMS,
      emotionMode: 'random',
      scenarioEmotions: DEFAULT_SCENARIO_EMOTIONS,
      previewEmotion: null,
      changeSignal: 0,

      setShape: (shape) => set((s) => ({ shape, changeSignal: s.changeSignal + 1 })),
      setEyeShape: (eyeShape) => set((s) => ({ eyeShape, changeSignal: s.changeSignal + 1 })),
      setEyeShapeMode: (eyeShapeMode) =>
        set((s) => ({ eyeShapeMode, changeSignal: s.changeSignal + 1 })),
      setEyeParam: (shape, key, value) =>
        set((state) => ({
          changeSignal: state.changeSignal + 1,
          eyeParams: {
            ...state.eyeParams,
            [shape]: {
              ...state.eyeParams[shape],
              [key]: value
            }
          }
        })),
      resetEyeParams: (targetShape) =>
        set((state) => ({
          changeSignal: state.changeSignal + 1,
          eyeParams: targetShape
            ? {
                ...state.eyeParams,
                [targetShape]: { ...DEFAULT_EYE_PARAMS[targetShape] }
              }
            : DEFAULT_EYE_PARAMS
        })),
      setEmotionMode: (emotionMode) =>
        set((s) => ({ emotionMode, changeSignal: s.changeSignal + 1 })),
      setScenarioEmotion: (scenario, emotion) =>
        set((state) => ({
          changeSignal: state.changeSignal + 1,
          scenarioEmotions: {
            ...state.scenarioEmotions,
            [scenario]: emotion
          }
        })),
      resetScenarioEmotions: () =>
        set((s) => ({
          scenarioEmotions: DEFAULT_SCENARIO_EMOTIONS,
          changeSignal: s.changeSignal + 1
        })),
      resetToDefaults: () =>
        set((s) => ({
          shape: DEFAULT_AGENT_PET_SHAPE,
          eyeShape: DEFAULT_AGENT_PET_EYE_SHAPE,
          eyeShapeMode: 'fixed',
          eyeParams: DEFAULT_EYE_PARAMS,
          emotionMode: 'random',
          scenarioEmotions: DEFAULT_SCENARIO_EMOTIONS,
          previewEmotion: null,
          changeSignal: s.changeSignal + 1
        })),
      setPreviewEmotion: (emotion) => set({ previewEmotion: emotion })
    }),
    {
      name: 'zen.agent.pet-settings',
      partialize: (state) => ({
        shape: state.shape,
        eyeShape: state.eyeShape,
        eyeShapeMode: state.eyeShapeMode,
        eyeParams: state.eyeParams,
        emotionMode: state.emotionMode,
        scenarioEmotions: state.scenarioEmotions
      }),
      merge: (persistedState, currentState) => {
        const p = (persistedState as Partial<AgentPetState>) || {}
        return {
          ...currentState,
          ...p,
          eyeParams: p.eyeParams ? { ...DEFAULT_EYE_PARAMS, ...p.eyeParams } : DEFAULT_EYE_PARAMS
        }
      }
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'zen.agent.pet-settings') {
      void useAgentPetStore.persist.rehydrate()
    }
  })
}
