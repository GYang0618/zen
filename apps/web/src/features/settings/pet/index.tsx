import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle
} from '@zen/ui'

import { SectionContent } from '../components/section-content'
import { PetEmotionSettings } from './components/pet-emotion-settings'
import { PetEyeSettings } from './components/pet-eye-settings'
import { PetPreviewStage } from './components/pet-preview-stage'
import { PetScenarioEmotions } from './components/pet-scenario-emotions'
import { PetShapeSelector } from './components/pet-shape-selector'
import { ResetPetSettingsButton } from './components/reset-pet-settings-button'

export function SettingsPet() {
  return (
    <SectionContent actions={<ResetPetSettingsButton />}>
      <FieldGroup>
        {/* 1. 实时视效预览舞台 */}
        <Field>
          <FieldLabel>实时效果预览</FieldLabel>
          <PetPreviewStage />
          <FieldDescription>
            实时查看当前宠物体态、眼睛与表情效果，可点击进行场景预览或触发 Q 弹果冻互动。
          </FieldDescription>
        </Field>

        <FieldSeparator />

        {/* 2. 宠物形态选择 */}
        <Field>
          <FieldLabel>宠物形态</FieldLabel>
          <PetShapeSelector />
          <FieldDescription>
            选择智能助手悬浮球的体态形态（共 20 款预设原型，完美适配主题自适应着色）。
          </FieldDescription>
        </Field>

        <FieldSeparator />

        {/* 3. 眼睛与眼型设置 */}
        <Field>
          <FieldLabel>眼睛设置</FieldLabel>
          <PetEyeSettings />
          <FieldDescription>配置眼睛的轮廓形态与轮换变幻模式。</FieldDescription>
        </Field>

        <FieldSeparator />

        {/* 4. 待机表情 */}
        <Field>
          <FieldLabel>待机表情</FieldLabel>
          <PetEmotionSettings />
          <FieldDescription>配置日常空闲状态下的表情变幻策略。</FieldDescription>
        </Field>

        <FieldSeparator />

        {/* 5. 各场景专属表情定制 */}
        <Field>
          <FieldLabel>场景专属表情定制</FieldLabel>
          <PetScenarioEmotions />
          <FieldDescription>
            为悬停、打开对话、拖拽、AI 思考、贴边休眠等 6 大核心场景赋予专属表情。
          </FieldDescription>
        </Field>

        <FieldSeparator />

        {/* 6. 重置全部设置 */}
        <Field orientation="responsive">
          <FieldContent>
            <FieldTitle>恢复宠物默认设置</FieldTitle>
            <FieldDescription>
              将宠物形态、眼睛、待机表情与各交互场景表情一次性恢复为系统默认初始状态。
            </FieldDescription>
          </FieldContent>
          <ResetPetSettingsButton />
        </Field>
      </FieldGroup>
    </SectionContent>
  )
}
