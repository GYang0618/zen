import { BadRequestException, PipeTransform } from '@nestjs/common'

import type { ZodType } from 'zod'

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join('; '))
    }
    return parsed.data
  }
}
