import {
  Code2,
  FileText,
  Globe2,
  Inbox,
  Languages,
  LayoutTemplate,
  Puzzle,
  TerminalSquare,
  Zap
} from 'lucide-react'

import type { Skill, SkillCategory } from '../types'

export const categories: { name: SkillCategory; icon: Skill['icon'] }[] = [
  { name: '全部', icon: LayoutTemplate },
  { name: '效率', icon: Zap },
  { name: '开发', icon: Code2 },
  { name: '数据', icon: TerminalSquare },
  { name: '内容', icon: FileText },
  { name: '集成', icon: Puzzle }
]

export const skills: Skill[] = [
  {
    id: 'web-research',
    name: 'Web Research',
    description: '搜索、阅读和归纳网页信息，为智能体提供带来源链接的可靠结论。',
    category: '效率',
    publisher: 'Zen 官方',
    installs: '12.8k',
    version: '2.4.1',
    updated: '今天',
    icon: Globe2,
    iconClassName: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    installed: true,
    verified: true,
    featured: true,
    capabilities: ['网页检索', '内容摘要', '来源引用']
  },
  {
    id: 'notion-workspace',
    name: 'Notion Workspace',
    description: '连接团队知识库，检索页面、更新数据库并整理项目文档。',
    category: '集成',
    publisher: 'Notion Labs',
    installs: '8.7k',
    version: '1.9.0',
    updated: '2 天前',
    icon: FileText,
    iconClassName: 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
    installed: true,
    verified: true,
    capabilities: ['页面检索', '数据库写入', '评论管理']
  },
  {
    id: 'github-engineer',
    name: 'GitHub Engineer',
    description: '读取仓库上下文，创建分支、提交变更并协助处理 Pull Request。',
    category: '开发',
    publisher: 'GitHub',
    installs: '7.2k',
    version: '3.1.2',
    updated: '5 天前',
    icon: Code2,
    iconClassName: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    verified: true,
    featured: true,
    capabilities: ['代码检索', 'PR 自动化', 'Issue 管理']
  },
  {
    id: 'spreadsheet-analysis',
    name: 'Spreadsheet Analysis',
    description: '分析表格、生成公式和洞察摘要，支持常见的 CSV 与 XLSX 数据。',
    category: '数据',
    publisher: 'Zen 官方',
    installs: '5.4k',
    version: '1.8.3',
    updated: '昨天',
    icon: TerminalSquare,
    iconClassName: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    installed: true,
    verified: true,
    capabilities: ['数据清洗', '公式生成', '图表建议']
  },
  {
    id: 'multilingual-writer',
    name: 'Multilingual Writer',
    description: '撰写、改写和本地化内容，保持品牌语气并适配多语言表达。',
    category: '内容',
    publisher: 'Lingua AI',
    installs: '4.1k',
    version: '2.0.6',
    updated: '1 周前',
    icon: Languages,
    iconClassName: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    capabilities: ['多语言写作', '语气改写', '本地化']
  },
  {
    id: 'inbox-triage',
    name: 'Inbox Triage',
    description: '按优先级梳理邮件，提取待办事项并生成简洁的回复草稿。',
    category: '效率',
    publisher: 'Zen Labs',
    installs: '3.6k',
    version: '1.5.4',
    updated: '3 天前',
    icon: Inbox,
    iconClassName: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    capabilities: ['邮件分类', '待办提取', '回复草稿']
  }
]
