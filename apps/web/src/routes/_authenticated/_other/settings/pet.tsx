import { createFileRoute } from '@tanstack/react-router'
import { PawPrint } from 'lucide-react'

import { SettingsPet } from '@/features/settings-v2/pet'

export const Route = createFileRoute('/_authenticated/_other/settings/pet')({
  component: SettingsPet,
  staticData: {
    title: '宠物',
    description: '自定义智能助手宠物的体态外形、眼睛眼型变幻与各交互场景专属表情。',
    icon: PawPrint,
    order: 35
  }
})
