export type CatalogDemoSpan = 'full' | 'half'

export interface CatalogNode {
  id: string
  component: string
  [key: string]: unknown
}

export interface CatalogDemo {
  id: string
  name: string
  description: string
  span: CatalogDemoSpan
  components: CatalogNode[]
}

export interface CatalogDemoGroup {
  id: string
  title: string
  badge: string
  demos: CatalogDemo[]
}

export function catalogDemo(
  id: string,
  name: string,
  description: string,
  components: CatalogNode[],
  span: CatalogDemoSpan = 'half'
): CatalogDemo {
  return { id, name, description, span, components }
}
