import { Module } from '@nestjs/common'

import { CommonModule } from '../../common/index.js'

/** 安全域：认证守卫、限流、幂等、异常过滤与审计上下文。 */
@Module({
  imports: [CommonModule],
  exports: [CommonModule]
})
export class SecurityModule {}
