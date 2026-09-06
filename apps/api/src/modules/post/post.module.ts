import { Module } from '@nestjs/common'

import { PostController } from './post.controller.js'
import { PostRepository } from './post.repository.js'
import { PostService } from './post.service.js'

@Module({
  controllers: [PostController],
  providers: [PostService, PostRepository],
  exports: [PostService, PostRepository]
})
export class PostModule {}
