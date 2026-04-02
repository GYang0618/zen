import type { ArgumentMetadata, PipeTransform } from '@nestjs/common'
import { BadRequestException, Injectable } from '@nestjs/common'
import type { ZodType } from 'zod'
import { z } from 'zod'

interface ZodValidationPipeOptions {
  /** 需要验证的参数类型，默认仅 'body' */
  types?: ArgumentMetadata['type'][]
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly types: ArgumentMetadata['type'][]

  constructor(
    private readonly schema: ZodType,
    options?: ZodValidationPipeOptions
  ) {
    this.types = options?.types ?? ['body']
  }

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (!this.types.includes(metadata.type)) {
      return value
    }

    const result = this.schema.safeParse(value)

    if (result.success) {
      return result.data
    }

    const flattened = z.flattenError(result.error)

    throw new BadRequestException({
      message: '参数验证失败',
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors
    })
  }
}
