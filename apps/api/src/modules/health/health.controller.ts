import { Controller, Get } from '@nestjs/common'

import { Public } from '@/common'

import { HealthService } from './health.service'

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('health')
  health() {
    return this.healthService.getStatus()
  }
}
