import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { organizationFocusSchema } from '@zen/shared'

/** 组织定位：打开组织架构页并选中 / 关键字过滤 */
export function useOrganizationFocusTool() {
  const navigate = useNavigate()
  useFrontendTool({
    name: 'focus_organization',
    description:
      '打开组织架构页面，可按组织 ID 选中节点，或按关键字（名称/编码）过滤左侧组织树',
    parameters: organizationFocusSchema,
    handler: async ({ id, keyword }) => {
      navigate({
        to: '/system/organization',
        search: {
          orgId: id,
          keyword
        }
      })
      return '已在前端组织架构界面为你定位节点'
    }
  })
}
