export interface JwtPayload {
  sub: string
  email: string
  typ?: 'access' | 'refresh'
  /** 权限版本；与租户 permVer 不一致时强制刷新 */
  permVer?: number
  iat?: number
  exp?: number
}
