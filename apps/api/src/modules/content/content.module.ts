import { Module } from '@nestjs/common'

import { DictModule } from '../dict/dict.module.js'
import { PostModule } from '../post/post.module.js'

/** 内容域：岗位编制与数据字典。 */
@Module({
  imports: [PostModule, DictModule]
})
export class ContentModule {}
