import { faker } from '@faker-js/faker'

import type { User } from './schema'

// Set a fixed seed for consistent data generation
faker.seed(67890)

export const users = Array.from({ length: 500 }, () => {
  const firstName = faker.person.firstName()
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    nickname: faker.person.fullName(),
    email: faker.internet.email({ firstName }).toLocaleLowerCase(),
    avatar: faker.image.avatar(),
    phone: faker.phone.number({ style: 'international' }),
    status: faker.helpers.arrayElement(['active', 'inactive', 'pending', 'suspended']),
    role: faker.helpers.arrayElement(['super_admin', 'admin', 'guest']),
    permissions: faker.helpers.arrayElements(['read', 'write', 'delete']),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  } as User
})
