import { useDefaultRenderTool } from '@copilotkit/react-core/v2'

export function useDefaultToolRender() {
  useDefaultRenderTool({
    render: ({ status }) => {
      console.log('🚀 ~ useDefaultToolRender ~ status:', status)
      return <div>默认执行</div>
    }
  })
}
