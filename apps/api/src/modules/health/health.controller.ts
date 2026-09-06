import { Controller, Get, Inject } from '@nestjs/common'

import { Public } from '../../common/index.js'
import { HealthService } from './health.service.js'

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Public()
  @Get('health')
  health() {
    return this.healthService.getStatus()
  }

  @Public()
  @Get('metrics')
  metrics() {
    return this.healthService.getMetrics()
  }
}
