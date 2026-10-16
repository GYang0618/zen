import type {
  Organization,
  OrganizationActivity,
  OrganizationMember,
  OrganizationStatisticsResponse,
  OrganizationTreeNode,
  Paged,
  Position
} from '@zen/shared'

export type OrganizationResponse = Organization
export type OrganizationTreeResponse = OrganizationTreeNode[]
export type OrganizationListResponse = Paged<OrganizationResponse>
export type OrganizationMemberResponse = OrganizationMember
export type PositionResponse = Position
export type OrganizationActivitiesResponse = Paged<OrganizationActivity>
export type { OrganizationStatisticsResponse }
