import { Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Request } from 'express'
import type { Observable } from 'rxjs'

export type AccessMeta = {
  route: string
  summary?: string
}

@Injectable()
export class AccessMetaInterceptor implements NestInterceptor {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { zenAccess?: AccessMeta }>()
    const op = this.reflector.get<{ summary?: string }>(
      'swagger/apiOperation',
      context.getHandler()
    )

    req.zenAccess = {
      route: req.route?.path ?? req.path,
      summary: op?.summary
    }

    return next.handle()
  }
}
