import { PermissionCode } from '@zen/shared'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Skeleton,
  Textarea
} from '@zen/ui'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { Header, Main } from '@/components/layouts'
import { SystemPageHeader } from '@/features/system/components'

import { useSiteConfig, useUpdateSiteConfig } from './queries'

export function SiteConfigPage() {
  const { data, isLoading } = useSiteConfig()
  const update = useUpdateSiteConfig()
  const [siteName, setSiteName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [flagsText, setFlagsText] = useState('{}')
  const [flagsError, setFlagsError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setSiteName(data.siteName)
    setLogoUrl(data.logoUrl ?? '')
    setFlagsText(JSON.stringify(data.featureFlags ?? {}, null, 2))
    setFlagsError(null)
  }, [data])

  const dirty =
    data != null &&
    (siteName !== data.siteName ||
      (logoUrl.trim() || '') !== (data.logoUrl ?? '') ||
      flagsText !== JSON.stringify(data.featureFlags ?? {}, null, 2))

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <SystemPageHeader title="站点配置" description="维护站点名称、Logo 与全局 Feature Flag" />

        {isLoading || !data ? (
          <Skeleton className="h-72 w-full max-w-2xl rounded-xl" />
        ) : (
          <Card className="max-w-2xl">
            <CardHeader className="border-b">
              <CardTitle>基础信息</CardTitle>
              <CardDescription>
                修改后点击保存立即生效；Feature Flags 须为合法 JSON 对象
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="site-name">站点名称</FieldLabel>
                  <Input
                    id="site-name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Zen"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="logo-url">Logo URL</FieldLabel>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <FieldDescription>留空则使用默认品牌标识</FieldDescription>
                </Field>
                <Field data-invalid={Boolean(flagsError) || undefined}>
                  <FieldLabel htmlFor="feature-flags">Feature Flags (JSON)</FieldLabel>
                  <Textarea
                    id="feature-flags"
                    className="min-h-36 font-mono text-sm"
                    value={flagsText}
                    aria-invalid={Boolean(flagsError) || undefined}
                    onChange={(e) => {
                      setFlagsText(e.target.value)
                      setFlagsError(null)
                    }}
                  />
                  {flagsError ? (
                    <p className="text-sm text-destructive">{flagsError}</p>
                  ) : (
                    <FieldDescription>键值均为布尔，例如 {`{ "betaChat": true }`}</FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </CardContent>
            <Can permission={PermissionCode.CONFIG_MANAGE}>
              <CardFooter className="justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {dirty ? '有未保存的更改' : '已与服务器同步'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!dirty || update.isPending}
                    onClick={() => {
                      setSiteName(data.siteName)
                      setLogoUrl(data.logoUrl ?? '')
                      setFlagsText(JSON.stringify(data.featureFlags ?? {}, null, 2))
                      setFlagsError(null)
                    }}
                  >
                    重置
                  </Button>
                  <Button
                    disabled={update.isPending || !dirty}
                    onClick={async () => {
                      try {
                        const featureFlags = JSON.parse(flagsText) as Record<string, boolean>
                        if (
                          featureFlags === null ||
                          typeof featureFlags !== 'object' ||
                          Array.isArray(featureFlags)
                        ) {
                          setFlagsError('必须是 JSON 对象')
                          return
                        }
                        await update.mutateAsync({
                          siteName,
                          logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
                          featureFlags
                        })
                        toast.success('站点配置已保存')
                      } catch {
                        setFlagsError('Feature Flags JSON 无效')
                        toast.error('Feature Flags JSON 无效')
                      }
                    }}
                  >
                    {update.isPending ? '保存中…' : '保存'}
                  </Button>
                </div>
              </CardFooter>
            </Can>
          </Card>
        )}
      </Main>
    </>
  )
}
