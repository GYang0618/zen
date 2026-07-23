import { SetMetadata } from '@nestjs/common'

export const REQUIRE_STEP_UP_KEY = 'requireStepUp'

/** 标记写操作需要二次确认（x-step-up-token） */
export const RequireStepUp = () => SetMetadata(REQUIRE_STEP_UP_KEY, true)
