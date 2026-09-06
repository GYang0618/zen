import { DEMO_NOTE_PERMISSIONS } from '../constants.js'

import type { DemoNoteDto } from '../note.schema.js'

export type NotesRequest = {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, body?: unknown) => Promise<T>
  patch: <T>(url: string, body?: unknown) => Promise<T>
  delete: <T>(url: string) => Promise<T>
}

export function createNotesApi(request: NotesRequest) {
  return {
    list: () => request.get<DemoNoteDto[]>('/demo/notes'),
    get: (id: string) => request.get<DemoNoteDto>(`/demo/notes/${id}`),
    create: (body: { title: string; content?: string; organizationId?: string }) =>
      request.post<DemoNoteDto>('/demo/notes', body),
    update: (
      id: string,
      body: { title?: string; content?: string | null; organizationId?: string }
    ) => request.patch<DemoNoteDto>(`/demo/notes/${id}`, body),
    remove: (id: string) => request.delete<DemoNoteDto>(`/demo/notes/${id}`)
  }
}

export { DEMO_NOTE_PERMISSIONS }
