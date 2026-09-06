import { NOTIF_PERMISSIONS } from '../constants.js'

import type { NotificationDto } from '../notification.schema.js'

export type NotificationsRequest = {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, body?: unknown) => Promise<T>
  patch: <T>(url: string, body?: unknown) => Promise<T>
}

export function createNotificationsApi(request: NotificationsRequest) {
  return {
    list: () => request.get<NotificationDto[]>('/notifications'),
    create: (body: { title: string; body?: string; userId?: string }) =>
      request.post<NotificationDto>('/notifications', body),
    markRead: (id: string) => request.patch<NotificationDto>(`/notifications/${id}/read`)
  }
}

export { NOTIF_PERMISSIONS }
