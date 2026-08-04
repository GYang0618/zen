import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { Search, WandSparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AppPageHeader } from '@/components/layouts/app-page-header'
import { Main } from '@/components/layouts/main'

import { FeaturedSkillCard, SkillCard } from './components/skill-card'
import { SkillDetailDialog } from './components/skill-detail-dialog'
import { SkillsPromo } from './components/skills-promo'
import { SkillsSidebar } from './components/skills-sidebar'
import { skills } from './data/skills'

import type { MarketTab, Skill, SkillCategory, SkillSort } from './types'

export function SkillsFeaturePage() {
  const [category, setCategory] = useState<SkillCategory>('全部')
  const [activeTab, setActiveTab] = useState<MarketTab>('explore')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SkillSort>('popular')
  const [installedSkills, setInstalledSkills] = useState(
    () => new Set(skills.filter((skill) => skill.installed).map((skill) => skill.id))
  )
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return skills
      .filter((skill) => activeTab !== 'installed' || installedSkills.has(skill.id))
      .filter((skill) => category === '全部' || skill.category === category)
      .filter(
        (skill) =>
          !normalizedQuery ||
          `${skill.name} ${skill.description} ${skill.publisher}`
            .toLocaleLowerCase()
            .includes(normalizedQuery)
      )
      .sort((a, b) => {
        if (sort === 'updated') return a.updated === '今天' ? -1 : b.updated === '今天' ? 1 : 0
        if (sort === 'name') return a.name.localeCompare(b.name)
        return Number(b.featured) - Number(a.featured)
      })
  }, [activeTab, category, installedSkills, query, sort])

  const toggleInstalled = (skillId: string) => {
    setInstalledSkills((current) => {
      const next = new Set(current)
      if (next.has(skillId)) next.delete(skillId)
      else next.add(skillId)
      return next
    })
  }

  const featuredSkills = skills.filter((skill) => skill.featured)

  return (
    <Main className="flex flex-col gap-6 py-6 @7xl/content:max-w-[1440px]">
      <AppPageHeader
        actions={
          <Button variant="outline" size="sm">
            <WandSparkles data-icon="inline-start" />
            提交技能
          </Button>
        }
      />

      <SkillsPromo installedCount={installedSkills.size} />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as MarketTab)}
        className="gap-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b">
          <TabsList variant="line" className="-mb-px gap-5 p-0">
            <TabsTrigger value="explore" className="h-10 flex-none px-0">
              发现技能
            </TabsTrigger>
            <TabsTrigger value="installed" className="h-10 flex-none px-0">
              已安装 <span className="ml-1 text-muted-foreground">{installedSkills.size}</span>
            </TabsTrigger>
          </TabsList>
          <Select value={sort} onValueChange={(value) => setSort(value as SkillSort)}>
            <SelectTrigger size="sm" aria-label="排序方式" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="popular">热门优先</SelectItem>
                <SelectItem value="updated">最近更新</SelectItem>
                <SelectItem value="name">名称排序</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 lg:grid-cols-[184px_minmax(0,1fr)]">
          <SkillsSidebar category={category} onCategoryChange={setCategory} />

          <div className="flex min-w-0 flex-col gap-4">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 pl-9"
                placeholder="搜索技能、发布者或能力"
              />
            </div>

            {activeTab === 'explore' && category === '全部' && !query && (
              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-medium">精选推荐</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    经过团队验证，适合常见工作流。
                  </p>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {featuredSkills.map((skill) => (
                    <FeaturedSkillCard
                      key={skill.id}
                      skill={skill}
                      installed={installedSkills.has(skill.id)}
                      onToggle={toggleInstalled}
                      onSelect={setSelectedSkill}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {activeTab === 'installed' ? '已安装的技能' : '全部技能'}{' '}
                  <span className="font-normal text-muted-foreground">{filteredSkills.length}</span>
                </h3>
                {query && <span className="text-xs text-muted-foreground">“{query}” 的结果</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    installed={installedSkills.has(skill.id)}
                    onToggle={toggleInstalled}
                    onSelect={setSelectedSkill}
                  />
                ))}
              </div>
              {filteredSkills.length === 0 && <EmptyResults />}
            </section>
          </div>
        </div>
      </Tabs>

      <SkillDetailDialog
        skill={selectedSkill}
        installed={selectedSkill ? installedSkills.has(selectedSkill.id) : false}
        onOpenChange={(open) => !open && setSelectedSkill(null)}
        onToggle={toggleInstalled}
      />
    </Main>
  )
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
      <Search className="size-5 text-muted-foreground" />
      <p className="font-medium">没有找到匹配的技能</p>
      <p className="text-sm text-muted-foreground">试试更换关键词或分类。</p>
    </div>
  )
}
