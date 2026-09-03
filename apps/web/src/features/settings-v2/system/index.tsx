import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea
} from '@zen/ui'

import { SectionContent } from '../components/section-content'
import { SystemLogoField } from './system-logo-field'

const LANGUAGE_OPTIONS = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en-US' }
] as const

const TIMEZONE_OPTIONS = [
  { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
  { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
  { label: '协调世界时 (UTC)', value: 'UTC' },
  { label: '纽约时间 (UTC-5/-4)', value: 'America/New_York' }
] as const

const DATE_FORMAT_OPTIONS = [
  { label: 'YYYY-MM-DD', value: 'yyyy-MM-dd' },
  { label: 'YYYY/MM/DD', value: 'yyyy/MM/dd' },
  { label: 'DD/MM/YYYY', value: 'dd/MM/yyyy' },
  { label: 'MM/DD/YYYY', value: 'MM/dd/yyyy' }
] as const

export function SettingsSystem() {
  return (
    <SectionContent>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>品牌标识</FieldLegend>
          <FieldDescription>展示在登录页、侧边栏与浏览器标签中的基础品牌信息。</FieldDescription>

          <FieldGroup>
            <SystemLogoField />
            <SystemLogoField
              title="Favicon"
              description="浏览器标签页图标。支持 PNG、SVG 或 WebP，建议 32×32 或 64×64。"
              alt="Favicon"
            />
            <Field>
              <FieldLabel htmlFor="system-name">系统名称</FieldLabel>
              <Input
                id="system-name"
                type="text"
                placeholder="Zen Admin"
                defaultValue="Zen Admin"
              />
              <FieldDescription>完整产品名称，显示在页面标题与登录页。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="system-short-name">系统简称</FieldLabel>
              <Input id="system-short-name" type="text" placeholder="Zen" defaultValue="Zen" />
              <FieldDescription>用于侧边栏折叠态、通知摘要等空间有限的场景。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="system-tagline">标语 / Slogan</FieldLabel>
              <Input
                id="system-tagline"
                type="text"
                placeholder="现代化企业管理平台"
                defaultValue="现代化企业管理平台"
              />
              <FieldDescription>可选，展示在登录页或关于页面的一句话介绍。</FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>版权与合规</FieldLegend>
          <FieldDescription>页脚版权、备案信息及对外法务链接。</FieldDescription>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="copyright">版权信息</FieldLabel>
              <Textarea
                id="copyright"
                placeholder="© 2026 Zen Admin. All rights reserved."
                defaultValue="© 2026 Zen Admin. All rights reserved."
              />
              <FieldDescription>
                显示在页面页脚，可使用 {'{year}'} 占位符表示当前年份。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="icp-number">ICP 备案号</FieldLabel>
              <Input id="icp-number" type="text" placeholder="京ICP备xxxxxxxx号" />
              <FieldDescription>国内站点合规展示用，留空则不显示。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="privacy-url">隐私政策链接</FieldLabel>
              <Input id="privacy-url" type="url" placeholder="https://example.com/privacy" />
            </Field>
            <Field>
              <FieldLabel htmlFor="terms-url">服务条款链接</FieldLabel>
              <Input id="terms-url" type="url" placeholder="https://example.com/terms" />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>区域与格式</FieldLegend>
          <FieldDescription>影响全站默认语言、时区与日期展示格式。</FieldDescription>

          <FieldGroup>
            <Field>
              <FieldLabel>默认语言</FieldLabel>
              <Select defaultValue="zh-CN">
                <SelectTrigger id="system-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>默认时区</FieldLabel>
              <Select defaultValue="Asia/Shanghai">
                <SelectTrigger id="system-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>日期格式</FieldLabel>
              <Select defaultValue="yyyy-MM-dd">
                <SelectTrigger id="system-date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {DATE_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>联系与支持</FieldLegend>
          <FieldDescription>对外展示的官方站点与技术支持渠道。</FieldDescription>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="official-website">官方网站</FieldLabel>
              <Input id="official-website" type="url" placeholder="https://example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="support-email">技术支持邮箱</FieldLabel>
              <Input id="support-email" type="email" placeholder="support@example.com" />
              <FieldDescription>用于「联系我们」、错误反馈与系统通知落款。</FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>系统状态</FieldLegend>
          <FieldDescription>控制对外可用性与基础访问策略。</FieldDescription>

          <FieldGroup className="max-w-md">
            <Field className="rounded-lg border p-4" orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="maintenance-mode">维护模式</FieldLabel>
                <FieldDescription>
                  开启后仅管理员可访问，普通用户将看到维护提示页。
                </FieldDescription>
              </FieldContent>
              <Switch id="maintenance-mode" />
            </Field>
            <Field className="rounded-lg border p-4" orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="allow-registration">允许新用户注册</FieldLabel>
                <FieldDescription>
                  关闭后登录页隐藏注册入口，仅可通过邀请创建账号。
                </FieldDescription>
              </FieldContent>
              <Switch id="allow-registration" defaultChecked />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Field orientation="horizontal">
          <Button type="button">保存系统设置</Button>
        </Field>
      </FieldGroup>
    </SectionContent>
  )
}
