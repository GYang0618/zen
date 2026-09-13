import { toast } from 'sonner'

import {
  ORGANIZATION_GRAPH_NODE_HEIGHT,
  ORGANIZATION_GRAPH_NODE_WIDTH
} from '../build-organization-graph'

import type { Edge } from '@xyflow/react'
import type { OrganizationGraphNode, OrganizationGraphRankdir } from '../build-organization-graph'

/**
 * 将当前展开可视的组织架构图绘制为高清 PNG 并触发浏览器下载
 */
export function exportOrganizationGraphToPng(
  nodes: OrganizationGraphNode[],
  edges: Edge[],
  rankdir: OrganizationGraphRankdir = 'TB'
) {
  if (nodes.length === 0) {
    toast.error('当前图谱为空，无法导出')
    return
  }

  // 1. 计算图谱包围盒
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const node of nodes) {
    const nx = node.position.x
    const ny = node.position.y
    if (nx < minX) minX = nx
    if (nx + ORGANIZATION_GRAPH_NODE_WIDTH > maxX) maxX = nx + ORGANIZATION_GRAPH_NODE_WIDTH
    if (ny < minY) minY = ny
    if (ny + ORGANIZATION_GRAPH_NODE_HEIGHT > maxY) maxY = ny + ORGANIZATION_GRAPH_NODE_HEIGHT
  }

  const PADDING = 60
  const HEADER_HEIGHT = 50
  const FOOTER_HEIGHT = 40
  const graphWidth = maxX - minX
  const graphHeight = maxY - minY
  const totalWidth = graphWidth + PADDING * 2
  const totalHeight = graphHeight + PADDING * 2 + HEADER_HEIGHT + FOOTER_HEIGHT

  const scale = 2 // 2x Retina 高清
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(totalWidth * scale)
  canvas.height = Math.round(totalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    toast.error('无法创建图形上下文')
    return
  }

  ctx.scale(scale, scale)

  // 2. 绘制背景
  ctx.fillStyle = '#f8fafc' // 优雅浅灰底色
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  // 3. 绘制顶部标题
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('企业组织架构图', PADDING, PADDING - 15)

  ctx.fillStyle = '#64748b'
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const timeStr = new Date().toLocaleString()
  ctx.fillText(
    `生成时间: ${timeStr} · 包含组织节点: ${nodes.length} 个`,
    PADDING + 140,
    PADDING - 15
  )

  // 偏移量基准
  const offsetX = PADDING - minX
  const offsetY = PADDING + HEADER_HEIGHT - minY

  // 创建 node 索引以便连线
  const nodeMap = new Map<string, OrganizationGraphNode>()
  for (const n of nodes) {
    nodeMap.set(n.id, n)
  }

  // 4. 绘制连线
  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#94a3b8'
  ctx.fillStyle = '#94a3b8'

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)
    if (!sourceNode || !targetNode) continue

    let startX: number
    let startY: number
    let endX: number
    let endY: number

    if (rankdir === 'LR') {
      startX = sourceNode.position.x + ORGANIZATION_GRAPH_NODE_WIDTH + offsetX
      startY = sourceNode.position.y + ORGANIZATION_GRAPH_NODE_HEIGHT / 2 + offsetY
      endX = targetNode.position.x + offsetX
      endY = targetNode.position.y + ORGANIZATION_GRAPH_NODE_HEIGHT / 2 + offsetY

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      const midX = (startX + endX) / 2
      ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY)
      ctx.stroke()

      // 箭头
      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(endX - 6, endY - 4)
      ctx.lineTo(endX - 6, endY + 4)
      ctx.closePath()
      ctx.fill()
    } else {
      startX = sourceNode.position.x + ORGANIZATION_GRAPH_NODE_WIDTH / 2 + offsetX
      startY = sourceNode.position.y + ORGANIZATION_GRAPH_NODE_HEIGHT + offsetY
      endX = targetNode.position.x + ORGANIZATION_GRAPH_NODE_WIDTH / 2 + offsetX
      endY = targetNode.position.y + offsetY

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      const midY = (startY + endY) / 2
      ctx.bezierCurveTo(startX, midY, endX, midY, endX, endY)
      ctx.stroke()

      // 箭头
      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(endX - 4, endY - 6)
      ctx.lineTo(endX + 4, endY - 6)
      ctx.closePath()
      ctx.fill()
    }
  }

  // 5. 绘制卡片
  for (const node of nodes) {
    const x = node.position.x + offsetX
    const y = node.position.y + offsetY
    const w = ORGANIZATION_GRAPH_NODE_WIDTH
    const h = ORGANIZATION_GRAPH_NODE_HEIGHT
    const org = node.data.organization

    // 卡片阴影与背景
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 2
    ctx.fillStyle = '#ffffff'
    drawRoundedRect(ctx, x, y, w, h, 10)
    ctx.fill()
    ctx.restore()

    // 卡片边框
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    drawRoundedRect(ctx, x, y, w, h, 10)
    ctx.stroke()

    // 顶部色彩装饰线
    ctx.fillStyle = org.type === 'project' ? '#8b5cf6' : '#3b82f6'
    ctx.beginPath()
    ctx.roundRect(x, y, w, 4, [10, 10, 0, 0])
    ctx.fill()

    // 组织名称
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(truncateText(ctx, org.name, w - 30), x + 16, y + 32)

    // 类型与权重标签
    let typeDesc = org.type === 'project' ? '项目组' : '标准部门'
    if (org.sortOrder && org.sortOrder !== 0) {
      typeDesc += ` · #${org.sortOrder}`
    }
    ctx.fillStyle = '#64748b'
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(typeDesc, x + 16, y + 54)

    // 分隔线
    ctx.strokeStyle = '#f1f5f9'
    ctx.beginPath()
    ctx.moveTo(x + 16, y + 68)
    ctx.lineTo(x + w - 16, y + 68)
    ctx.stroke()

    // 底部信息：负责人 & 编制人数
    ctx.fillStyle = '#475569'
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const leaderText = org.leader?.name ? `负责人: ${org.leader.name}` : '未指定负责人'
    ctx.fillText(truncateText(ctx, leaderText, 140), x + 16, y + 94)

    // 人数胶囊
    const memberText = `${org.memberCount} 人`
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const memberWidth = ctx.measureText(memberText).width + 16
    const memberPillX = x + w - memberWidth - 16
    const memberPillY = y + 80
    ctx.fillStyle = '#f1f5f9'
    drawRoundedRect(ctx, memberPillX, memberPillY, memberWidth, 20, 10)
    ctx.fill()

    ctx.fillStyle = '#475569'
    ctx.fillText(memberText, memberPillX + 8, memberPillY + 14)
  }

  // 6. 导出图片
  canvas.toBlob((blob) => {
    if (!blob) {
      toast.error('导出图片生成失败')
      return
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `企业组织架构图_${new Date().toISOString().slice(0, 10)}.png`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('组织架构图高清 PNG 导出成功')
  }, 'image/png')
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.closePath()
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let low = 0
  let high = text.length
  let result = text
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const slice = `${text.slice(0, mid)}…`
    if (ctx.measureText(slice).width <= maxWidth) {
      result = slice
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return result
}
