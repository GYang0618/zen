import { SetMetadata } from '@nestjs/common'

/** 已登录即可访问的写接口（不要求具体权限码，仍受 AuthGuard 约束） */
export const ALLOW_AUTHENTICATED_KEY = 'allow_authenticated'

export const AllowAuthenticated = () => SetMetadata(ALLOW_AUTHENTICATED_KEY, true)
