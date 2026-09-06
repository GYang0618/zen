import { Test } from '@nestjs/testing'
import request from 'supertest'

import { OrganizationController } from '../src/modules/organization/organization.controller.js'
import { OrganizationService } from '../src/modules/organization/organization.service.js'

import type { INestApplication } from '@nestjs/common'

describe('OrganizationController routes (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [{ provide: OrganizationService, useValue: {} }]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('does not expose the legacy organization route', async () => {
    await request(app.getHttpServer()).get('/organization/tree').expect(404)
  })

  it('exposes the V2 organizations route', async () => {
    await request(app.getHttpServer()).get('/organizations/tree').expect(401)
  })
})
