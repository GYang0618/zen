'use client'

import { useMemo } from 'react'

import { useTheme } from '@/context/theme-provider'
import { Pet } from '@/features/pets'

import { useChatThreadId } from '../context/chat-agent-context'
import { resolveThreadPetAppearance } from '../lib/thread-pet-palette'

import type { PetEmotion, PetEyeParamsMap } from '@/features/pets'

/** 工作态只在自然、眨眼、委屈之间轮换。 */
const WORKING_PET_EMOTIONS: readonly PetEmotion[] = ['normal', 'wink', 'sad']

/** 胶囊眼：宽 15、长 30，圆角按宽度收成胶囊。 */
const WORKING_PET_EYE_PARAMS: Partial<PetEyeParamsMap> = {
  capsule: {
    width: 15,
    height: 30,
    rxFactor: 0.5
  }
}

const WORKING_PET_GAZE: [number, number] = [0, 0]

const WORKING_PET_EMOTION_INTERVAL_SEC = 4

/**
 * 会话进行中的宠物：形状与颜色跟当前对话欢迎屏一致，表情与视线仍按工作态随机。
 */
export function WorkingPet() {
  const threadId = useChatThreadId()
  const { resolvedTheme } = useTheme()
  const { shape, color } = useMemo(() => {
    const appearance = resolveThreadPetAppearance(threadId)
    return {
      shape: appearance.shape,
      color: resolvedTheme === 'dark' ? appearance.palette.dark : appearance.palette.light
    }
  }, [resolvedTheme, threadId])

  return (
    <Pet
      shape={shape}
      eyeShape="capsule"
      eyeParams={WORKING_PET_EYE_PARAMS}
      emotionMode="random"
      randomEmotions={WORKING_PET_EMOTIONS}
      randomEmotionInterval={WORKING_PET_EMOTION_INTERVAL_SEC}
      gazeMode="random"
      fixedGaze={WORKING_PET_GAZE}
      color={color}
      interactive={false}
      enableSquishOnClick={false}
      showShadow={false}
      className="size-8 shrink-0"
      width="100%"
      height="100%"
    />
  )
}
