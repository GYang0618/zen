import { useComponent } from '@copilotkit/react-core/v2'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle
} from '@zen/ui'
import { useState } from 'react'
import { z } from 'zod'

import { GIS_SCENE_MODEL_CATEGORY_LABELS, GIS_SCENE_MODELS } from '../../scene-models'

import type { GisSceneModelCategoryId } from '../../scene-models'

const GIS_SCENE_MODEL_CATEGORY_IDS = Object.keys(GIS_SCENE_MODEL_CATEGORY_LABELS) as [
  GisSceneModelCategoryId,
  ...GisSceneModelCategoryId[]
]

const sceneModelCatalogSchema = z.object({
  category: z
    .enum(GIS_SCENE_MODEL_CATEGORY_IDS)
    .optional()
    .describe(
      `只展示某一类可部署模型。省略则展示全部。${GIS_SCENE_MODEL_CATEGORY_IDS.map(
        (categoryId) => `${categoryId}（${GIS_SCENE_MODEL_CATEGORY_LABELS[categoryId]}）`
      ).join('、')}`
    )
})

type SceneModelCatalogProps = z.infer<typeof sceneModelCatalogSchema>

/** 用户要浏览或挑选可部署模型时，在对话里展示模型目录。 */
export function useSceneModelCatalogGenerativeUI() {
  useComponent({
    name: 'gis_scene_model_catalog',
    description:
      '展示当前可部署的三维模型目录。用户询问有哪些模型、想浏览或挑选模型时调用。用预览列表展示，不要改用纯文本罗列。可按 category 只展示一类；省略 category 则展示全部。',
    parameters: sceneModelCatalogSchema,
    render: SceneModelCatalog
  })
}

function SceneModelCatalog({ category }: SceneModelCatalogProps) {
  const models = category
    ? GIS_SCENE_MODELS.filter((model) => model.category === category)
    : GIS_SCENE_MODELS
  const title = category ? GIS_SCENE_MODEL_CATEGORY_LABELS[category] : '可部署模型'

  if (models.length === 0) {
    return <p className="text-sm text-muted-foreground">没有可展示的模型。</p>
  }

  return (
    <section className="w-full max-w-full" aria-label={title}>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <AttachmentGroup>
        {models.map((model) => (
          <SceneModelAttachment
            key={model.id}
            label={model.label}
            categoryLabel={GIS_SCENE_MODEL_CATEGORY_LABELS[model.category]}
            preview={model.preview}
          />
        ))}
      </AttachmentGroup>
    </section>
  )
}

function SceneModelAttachment({
  label,
  categoryLabel,
  preview
}: {
  label: string
  categoryLabel: string
  preview?: string
}) {
  const [failed, setFailed] = useState(false)
  const showPreview = Boolean(preview) && !failed

  return (
    <Attachment orientation="vertical" state={showPreview ? 'done' : 'idle'}>
      <AttachmentMedia variant="image">
        {showPreview ? (
          <img
            src={preview}
            alt={`${label}预览`}
            className="object-contain!"
            onError={() => setFailed(true)}
          />
        ) : null}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{label}</AttachmentTitle>
        <AttachmentDescription>{categoryLabel}</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  )
}
