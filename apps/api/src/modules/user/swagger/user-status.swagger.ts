/** 与 @zen/shared userStatusSchema 对齐 */
export enum UserStatusSwagger {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum UsersSortBySwagger {
  USERNAME = 'username',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
  LAST_LOGIN_AT = 'lastLoginAt'
}

export enum UsersSortOrderSwagger {
  ASC = 'asc',
  DESC = 'desc'
}
