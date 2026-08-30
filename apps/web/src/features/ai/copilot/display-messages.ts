export interface DisplayMessageLike {
  id: string
  role: string
}

export class DisplayMessageCache<TMessage extends DisplayMessageLike = DisplayMessageLike> {
  private threadId?: string
  private order: string[] = []
  private persistedUsers = new Map<string, TMessage>()

  merge(threadId: string, messages: TMessage[]): TMessage[] {
    if (this.threadId !== threadId) {
      this.threadId = threadId
      this.order = []
      this.persistedUsers.clear()
    }

    const byId = new Map<string, TMessage>()
    for (const message of messages) {
      byId.set(message.id, message)
      if (!this.order.includes(message.id)) this.order.push(message.id)
      if (message.role === 'user') this.persistedUsers.set(message.id, message)
    }

    for (const [id, userMessage] of this.persistedUsers) {
      if (byId.has(id)) continue
      byId.set(id, userMessage)
      if (!this.order.includes(id)) this.order.push(id)
    }

    return this.order
      .map((id) => byId.get(id))
      .filter((message): message is TMessage => message !== undefined)
  }
}
