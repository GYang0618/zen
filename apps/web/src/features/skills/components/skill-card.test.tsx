import { Circle } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { FeaturedSkillCard } from './skill-card'

const skill = {
  id: 'test-skill',
  name: '测试技能',
  description: '用于验证精选技能卡片的交互语义。',
  category: '开发' as const,
  publisher: 'Zen',
  installs: '1',
  version: '1.0.0',
  updated: '刚刚',
  icon: Circle,
  iconClassName: 'bg-muted text-muted-foreground',
  capabilities: []
}

describe('FeaturedSkillCard', () => {
  it('keeps the detail and install buttons as sibling controls', () => {
    const markup = renderToStaticMarkup(
      <FeaturedSkillCard skill={skill} installed onSelect={vi.fn()} onToggle={vi.fn()} />
    )

    expect(markup).not.toMatch(/<button\b[^>]*>(?:(?!<\/button>).)*<button\b/s)
    expect(markup.match(/<button\b/g)).toHaveLength(2)
  })
})
