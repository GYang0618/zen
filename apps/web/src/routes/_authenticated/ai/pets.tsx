import { createFileRoute } from '@tanstack/react-router'
import { Cat } from 'lucide-react'

import { PetsGallery } from '@/features/pets'

export const Route = createFileRoute('/_authenticated/ai/pets')({
  component: PetsGallery,
  staticData: {
    title: '宠物中心',
    icon: Cat,
    order: 4
  }
})
