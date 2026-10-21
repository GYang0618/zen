import { Module } from '@nestjs/common'

import { DictionaryController } from './dictionary.controller.js'

@Module({
  controllers: [DictionaryController]
})
export class DictModule {}
