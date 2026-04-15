import { Injectable } from '@nestjs/common'

@Injectable()
export class HealthService {
  async getStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  }
}
