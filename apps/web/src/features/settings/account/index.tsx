import { FieldGroup, FieldSeparator } from '@zen/ui'

import { SectionContent } from '../components/section-content'
import { DeleteAccountSection } from './delete-account-section'
import { MfaSection } from './mfa-section'
import { PasswordForm } from './password-form'

export function SettingsAccount() {
  return (
    <SectionContent>
      <FieldGroup>
        <PasswordForm />
        <FieldSeparator />
        <MfaSection />
        <FieldSeparator />
        <DeleteAccountSection />
      </FieldGroup>
    </SectionContent>
  )
}
