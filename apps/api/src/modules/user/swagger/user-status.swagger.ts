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
  JOB_TITLE = 'jobTitle',
  CREATED_AT = 'createdAt'
}

export enum UsersSortOrderSwagger {
  ASC = 'asc',
  DESC = 'desc'
}
