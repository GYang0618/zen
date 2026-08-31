import { Button, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@zen/ui'
import { Check, MoreHorizontal, ShieldCheck } from 'lucide-react'

import type { MouseEventHandler } from 'react'
import type { Skill } from '../types'

type SkillCardProps = {
  skill: Skill
  installed: boolean
  onToggle: (id: string) => void
  onSelect: (skill: Skill) => void
}

export function FeaturedSkillCard({ skill, installed, onToggle, onSelect }: SkillCardProps) {
  return (
    <article className="flex min-w-0 gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <SkillIcon skill={skill} />
      <button className="min-w-0 flex-1 text-left" type="button" onClick={() => onSelect(skill)}>
        <SkillTitle skill={skill} />
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
          {skill.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {skill.publisher} · {skill.installs} 安装
          </span>
          <SkillAction
            installed={installed}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(skill.id)
            }}
          />
        </div>
      </button>
    </article>
  )
}

export function SkillCard({ skill, installed, onToggle, onSelect }: SkillCardProps) {
  return (
    <article className="flex min-h-58 flex-col rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <SkillIcon skill={skill} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label={`${skill.name} 更多操作`} variant="ghost" size="icon-sm">
                <MoreHorizontal />
              </Button>
            </TooltipTrigger>
            <TooltipContent>更多操作</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <button type="button" onClick={() => onSelect(skill)} className="mt-3 text-left">
        <SkillTitle skill={skill} />
        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {skill.description}
        </p>
      </button>
      <div className="mt-auto pt-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{skill.category}</span>
          <span>{skill.installs} 安装</span>
        </div>
        <SkillAction installed={installed} onClick={() => onToggle(skill.id)} />
      </div>
    </article>
  )
}

function SkillTitle({ skill }: { skill: Skill }) {
  return (
    <div className="flex items-center gap-1.5">
      <h4 className="truncate font-medium">{skill.name}</h4>
      {skill.verified && <ShieldCheck className="size-3.5 shrink-0 text-primary" />}
    </div>
  )
}
function SkillIcon({ skill }: { skill: Skill }) {
  const Icon = skill.icon
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
        skill.iconClassName
      )}
    >
      <Icon className="size-5" />
    </div>
  )
}
function SkillAction({
  installed,
  onClick
}: {
  installed: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <Button variant={installed ? 'outline' : 'default'} size="sm" onClick={onClick}>
      {installed ? (
        <>
          <Check data-icon="inline-start" />
          已安装
        </>
      ) : (
        '安装'
      )}
    </Button>
  )
}
