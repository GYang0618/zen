import { isReadonlyPermissionCode, PermissionCode, resolveFileCategory } from '@zen/shared'

import { sniffMime } from './storage.mime'

describe('sniffMime', () => {
  it('将 PK 头的 docx 识别为 Word，而不是 zip', () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])
    expect(sniffMime(buffer, '报告.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    expect(sniffMime(buffer, 'backup.zip')).toBe('application/zip')
  })

  it('识别 mp4 ftyp', () => {
    const buffer = Buffer.alloc(12)
    buffer.write('ftyp', 4, 'ascii')
    expect(sniffMime(buffer, 'clip.mp4')).toBe('video/mp4')
  })
})

describe('resolveFileCategory', () => {
  it('按 mime 与扩展名分类', () => {
    expect(resolveFileCategory({ mimeType: 'image/png', originalName: 'a.png' })).toBe('image')
    expect(resolveFileCategory({ mimeType: 'video/mp4', originalName: 'a.mp4' })).toBe('video')
    expect(resolveFileCategory({ mimeType: 'application/pdf', originalName: 'a.pdf' })).toBe(
      'document'
    )
    expect(resolveFileCategory({ mimeType: 'application/zip', originalName: 'a.zip' })).toBe(
      'archive'
    )
    expect(
      resolveFileCategory({
        mimeType: 'application/zip',
        originalName: 'a.docx'
      })
    ).toBe('document')
  })
})

describe('isReadonlyPermissionCode', () => {
  it('将 system:file:read 视为只读，upload 不是', () => {
    expect(isReadonlyPermissionCode(PermissionCode.FILE_READ)).toBe(true)
    expect(isReadonlyPermissionCode(PermissionCode.FILE_UPLOAD)).toBe(false)
  })
})
