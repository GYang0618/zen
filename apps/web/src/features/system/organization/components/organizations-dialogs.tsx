import { useOrganizations } from '../organizations-provider'
import { OrganizationActionSheet } from './organization-action-sheet'
import { OrganizationLeaderDialog } from './organization-leader-dialog'
import { OrganizationTypeCatalogSheet } from './organization-type-catalog-sheet'

export function OrganizationsDialogs() {
  const { open, setOpen, currentNode } = useOrganizations()

  const handleAddOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'add' : null)
  }

  const handleEditOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'edit' : null)
  }

  const handleLeaderOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'edit-leader' : null)
  }

  const handleTypeCatalogOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'type-catalog' : null)
  }

  return (
    <>
      <OrganizationActionSheet open={open === 'add'} onOpenChange={handleAddOpenChange} />
      <OrganizationTypeCatalogSheet
        open={open === 'type-catalog'}
        onOpenChange={handleTypeCatalogOpenChange}
      />

      {currentNode ? (
        <>
          <OrganizationActionSheet
            key={`edit-${currentNode.id}`}
            currentRow={currentNode}
            open={open === 'edit'}
            onOpenChange={handleEditOpenChange}
          />
          <OrganizationLeaderDialog
            key={`leader-${currentNode.id}`}
            currentRow={currentNode}
            open={open === 'edit-leader'}
            onOpenChange={handleLeaderOpenChange}
          />
        </>
      ) : null}
    </>
  )
}
