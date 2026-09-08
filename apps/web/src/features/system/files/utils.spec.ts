import { describe, expect, it } from 'vitest'

import { firstFrameTime, formatFileFormat, formatFileSize } from './utils'

describe('formatFileSize', () => {
  it('formats bytes under 1 KB', () => {
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('formats megabytes with one decimal', () => {
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB')
  })
})

describe('firstFrameTime', () => {
  it('returns 0 for unknown or empty duration', () => {
    expect(firstFrameTime(Number.NaN)).toBe(0)
    expect(firstFrameTime(0)).toBe(0)
    expect(firstFrameTime(-1)).toBe(0)
  })

  it('keeps ultra-short clips at the start', () => {
    expect(firstFrameTime(0.12)).toBe(0)
  })

  it('seeks slightly past zero so the first visible frame can decode', () => {
    expect(firstFrameTime(12)).toBe(0.1)
  })
})

describe('formatFileFormat', () => {
  it('prefers the original file extension', () => {
    expect(formatFileFormat({ originalName: '头像.JPEG', mimeType: 'image/jpeg' })).toBe('JPEG')
  })

  it('uses the MIME type when the file name has no extension', () => {
    expect(
      formatFileFormat({ originalName: '导出文件', mimeType: 'application/pdf; charset=utf-8' })
    ).toBe('application/pdf')
  })

  it('falls back to an unknown format label', () => {
    expect(formatFileFormat({ originalName: '未命名', mimeType: null })).toBe('未知格式')
  })
})
