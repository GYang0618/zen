import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  deriveProvisionalThreadTitle,
  isReplaceableProvisionalTitle,
  THREAD_PROVISIONAL_TITLE_MAX_LENGTH
} from '../dist/domains/copilot/thread-title.js'

describe('thread-title', () => {
  it('取第一句话并截断到 30 字以内', () => {
    const title = deriveProvisionalThreadTitle(
      '帮我配置一个现代化的莫兰迪色系主题，并且同步更新侧边栏样式。第二句不应出现。'
    )
    assert.equal(title, '帮我配置一个现代化的莫兰迪色系主题，并且同步更新侧边栏样式')
    assert.ok(title.length <= THREAD_PROVISIONAL_TITLE_MAX_LENGTH)
  })

  it('超长首句按 30 字截断', () => {
    const long = '这是一句没有句号但非常非常非常非常非常非常非常非常非常非常长的用户输入内容'
    const title = deriveProvisionalThreadTitle(long)
    assert.equal(title.length, THREAD_PROVISIONAL_TITLE_MAX_LENGTH)
    assert.equal(title, long.slice(0, THREAD_PROVISIONAL_TITLE_MAX_LENGTH))
  })

  it('短句不去截断', () => {
    assert.equal(deriveProvisionalThreadTitle('你好'), '你好')
  })

  it('临时标题可被识别为可替换', () => {
    const message = '请问系统工作流引擎怎么用'
    const provisional = deriveProvisionalThreadTitle(message)
    assert.equal(isReplaceableProvisionalTitle(provisional, message), true)
    assert.equal(isReplaceableProvisionalTitle(null, message), true)
    assert.equal(isReplaceableProvisionalTitle('我手动改的', message), false)
  })
})
