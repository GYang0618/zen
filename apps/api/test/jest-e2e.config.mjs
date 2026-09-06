import config from '../jest.config.mjs'

export default {
  ...config,
  rootDir: '..',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts']
}
