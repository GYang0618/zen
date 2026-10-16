import { createMiddleware } from 'langchain'

import { hydrateMessageImages } from '@/files/message-images'

/** 在模型请求发出前，把用户消息中的图片文件 ID 换成可查看的图像。 */
export function createMessageImageMiddleware() {
  return createMiddleware({
    name: 'chatMessageImages',
    wrapModelCall: async (request, handler) => {
      const messages = await hydrateMessageImages(request.messages)
      if (messages === request.messages) return handler(request)
      return handler({ ...request, messages })
    }
  })
}
