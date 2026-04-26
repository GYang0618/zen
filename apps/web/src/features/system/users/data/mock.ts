import { faker } from '@faker-js/faker'

import type { User } from './schema'

// 设置固定的随机种子，保证数据一致性
faker.seed(67890)

export const users = Array.from({ length: 500 }, () => {
  const firstName = faker.person.firstName()
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    nickname: faker.person.fullName(),
    realName: null,
    email: faker.internet.email({ firstName }).toLocaleLowerCase(),
    avatar: faker.image.avatar(),
    phoneNumber: faker.phone.number({ style: 'international' }),
    status: faker.helpers.arrayElement(['active', 'inactive', 'pending', 'suspended'] as const),
    role: faker.helpers.arrayElement(['super_admin', 'admin', 'guest'] as const),
    deptName: null,
    jobTitle: null,
    permissions: faker.helpers.arrayElements(['read', 'write', 'delete']),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString()
  } satisfies User
})
