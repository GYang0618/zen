import { FieldGroup, FieldSeparator } from '@zen/ui'

import { SectionContent } from '../components/section-content'
import { MfaSection } from './mfa-section'
import { PasswordForm } from './password-form'

export function SettingsAccount() {
  return (
    <SectionContent>
      <FieldGroup>
        <PasswordForm />
        <FieldSeparator />
        <MfaSection />
      </FieldGroup>
    </SectionContent>
  )
}
