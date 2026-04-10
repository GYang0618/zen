import { createUserSchema } from './create-user.dto'

import type { z } from 'zod'

export const updateUserSchema = createUserSchema.partial()

export type UpdateUserDto = z.infer<typeof updateUserSchema>
