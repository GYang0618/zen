import { PLUGIN_CATALOG } from '@zen/plugin-registry/catalog'
import { PermissionCode, toolManifestSchema } from '@zen/shared'

import type { ToolExecutionPolicy } from '@zen/shared'

export type { ToolExecutionPolicy, ToolRiskLevel, ToolSideEffect } from '@zen/shared'

const pluginPolicies: Record<string, ToolExecutionPolicy> = Object.fromEntries(
  PLUGIN_CATALOG.flatMap((entry) =>
    'agentTools' in entry
      ? entry.agentTools.manifests.map((manifest) => [
          manifest.name,
          toolManifestSchema.parse(manifest)
        ])
      : []
  )
)

const READ_POLICY = {
  riskLevel: 'low',
  sideEffect: 'none',
  requiresApproval: false,
  timeoutMs: 15_000,
  retryPolicy: {
    maxRetries: 2,
    retryableReasons: ['NETWORK_ERROR', 'RATE_LIMITED', 'TIMEOUT']
  },
  idempotencyPolicy: 'none'
} as const satisfies Omit<ToolExecutionPolicy, 'permissionCode'>

const WRITE_POLICY = {
  riskLevel: 'medium',
  sideEffect: 'write',
  requiresApproval: false,
  timeoutMs: 30_000,
  retryPolicy: { maxRetries: 0, retryableReasons: [] },
  idempotencyPolicy: 'run-tool-call'
} as const satisfies Omit<ToolExecutionPolicy, 'permissionCode'>

function read(permissionCode?: string): ToolExecutionPolicy {
  return { ...READ_POLICY, permissionCode }
}

function write(permissionCode: string, requiresApproval = false): ToolExecutionPolicy {
  return {
    ...WRITE_POLICY,
    permissionCode,
    requiresApproval,
    riskLevel: requiresApproval ? 'high' : 'medium'
  }
}

function destructive(permissionCode: string): ToolExecutionPolicy {
  return {
    ...WRITE_POLICY,
    permissionCode,
    riskLevel: 'critical',
    sideEffect: 'destructive',
    requiresApproval: true
  }
}

export const TOOL_EXECUTION_POLICIES = {
  query_users_list: read(PermissionCode.USER_LIST),
  query_user_detail: read(PermissionCode.USER_LIST),
  create_user: write(PermissionCode.USER_CREATE),
  update_user_info: write(PermissionCode.USER_UPDATE),
  restore_deleted_users: write(PermissionCode.USER_UPDATE, true),
  update_user_status: write(PermissionCode.USER_STATUS, true),
  unlock_user: write(PermissionCode.USER_UPDATE),
  reset_user_password: write(PermissionCode.USER_UPDATE, true),
  revoke_user_sessions: write(PermissionCode.USER_UPDATE, true),
  assign_user_roles: write(PermissionCode.ROLE_ASSIGN, true),
  replace_user_organizations: write(PermissionCode.ORG_UPDATE, true),
  delete_users: destructive(PermissionCode.USER_DELETE),
  hard_delete_users: destructive(PermissionCode.USER_DELETE),

  query_roles_list: read(PermissionCode.ROLE_LIST),
  query_role_detail: read(PermissionCode.ROLE_LIST),
  query_permissions_list: read(PermissionCode.ROLE_LIST),
  query_role_members: read(PermissionCode.ROLE_LIST),
  create_role: write(PermissionCode.ROLE_CREATE),
  update_role_info: write(PermissionCode.ROLE_UPDATE),
  clone_role: write(PermissionCode.ROLE_CREATE),
  add_role_members: write(PermissionCode.ROLE_ASSIGN, true),
  remove_role_member: write(PermissionCode.ROLE_ASSIGN),
  assign_role_permissions: write(PermissionCode.ROLE_UPDATE, true),
  assign_role_data_scope: write(PermissionCode.ROLE_UPDATE, true),
  delete_roles: destructive(PermissionCode.ROLE_DELETE),

  query_organization_tree: read(PermissionCode.ORG_LIST),
  query_organization_type_catalog: read(),
  query_organization_detail: read(PermissionCode.ORG_LIST),
  query_organization_members: read(PermissionCode.ORG_LIST),
  query_organization_positions: read(PermissionCode.POST_LIST),
  query_organization_activities: read(PermissionCode.ORG_LIST),
  update_organization_type_catalog: write(PermissionCode.ORG_UPDATE),
  create_organization: write(PermissionCode.ORG_CREATE),
  update_organization_info: write(PermissionCode.ORG_UPDATE),
  update_organization_leader: write(PermissionCode.ORG_UPDATE),
  change_organization_parent: write(PermissionCode.ORG_UPDATE, true),
  add_organization_member: write(PermissionCode.ORG_UPDATE),
  remove_organization_member: write(PermissionCode.ORG_UPDATE, true),
  create_organization_position: write(PermissionCode.POST_MANAGE),
  update_organization_position: write(PermissionCode.POST_MANAGE),
  remove_organization_position: destructive(PermissionCode.POST_MANAGE),

  query_job_profiles_list: read(PermissionCode.POST_LIST),
  query_job_profile_detail: read(PermissionCode.POST_LIST),
  create_job_profile: write(PermissionCode.POST_MANAGE),
  update_job_profile_info: write(PermissionCode.POST_MANAGE),
  delete_job_profile: destructive(PermissionCode.POST_MANAGE),

  ...pluginPolicies
} as const satisfies Record<string, ToolExecutionPolicy>

type PluginWithTools = Extract<(typeof PLUGIN_CATALOG)[number], { agentTools: unknown }>
export type RegisteredToolName =
  | keyof typeof TOOL_EXECUTION_POLICIES
  | PluginWithTools['agentTools']['manifests'][number]['name']

export function getToolExecutionPolicy(toolName: string): ToolExecutionPolicy | undefined {
  return (TOOL_EXECUTION_POLICIES as Record<string, ToolExecutionPolicy>)[toolName]
}

export const APPROVAL_REQUIRED_TOOLS = Object.entries(TOOL_EXECUTION_POLICIES)
  .filter(([, policy]) => policy.requiresApproval)
  .map(([name]) => name)

export const RETRYABLE_READ_TOOLS = Object.entries(TOOL_EXECUTION_POLICIES)
  .filter(([, policy]) => policy.retryPolicy.maxRetries > 0)
  .map(([name]) => name)

export function createApprovalPolicy() {
  return Object.fromEntries(
    APPROVAL_REQUIRED_TOOLS.map((name) => [
      name,
      {
        allowedDecisions: ['approve', 'reject'] as ('approve' | 'reject')[],
        description: '此操作会修改敏感业务数据，请确认 Tool 名称和参数后继续。'
      }
    ])
  )
}
