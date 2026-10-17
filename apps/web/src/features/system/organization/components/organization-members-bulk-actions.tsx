'use no memo'

import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { ArrowRightLeft, UserRoundMinus } from 'lucide-react'
import { useState } from 'react'

import { BulkActionsToolbar } from '@/components/data-table'

import { OrganizationBatchRemoveDialog } from './organization-batch-remove-dialog'

import type { OrganizationMember } from '../type'

type OrganizationMembersBulkActionsProps = {
  organizationId: string
  selectedMembers: OrganizationMember[]
  isSelecting?: boolean
  onClearSelection: () => void
  onBatchTransfer: () => void
}

export function OrganizationMembersBulkActions({
  organizationId,
  selectedMembers,
  isSelecting = false,
  onClearSelection,
  onBatchTransfer
}: OrganizationMembersBulkActionsProps) {
  const [removeOpen, setRemoveOpen] = useState(false)
  const hasSelection = selectedMembers.length > 0

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedMembers.length}
        entityName="成员"
        visible={isSelecting}
        onClearSelection={onClearSelection}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                onClick={onBatchTransfer}
                className="size-8"
                aria-label="批量调动部门"
                disabled={!hasSelection}
              />
            }
          >
            <ArrowRightLeft />
            <span className="sr-only">批量调动部门</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasSelection ? '批量调动部门' : '请先选择成员'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setRemoveOpen(true)}
                className="size-8"
                aria-label="批量移除成员"
                disabled={!hasSelection}
              />
            }
          >
            <UserRoundMinus />
            <span className="sr-only">批量移除成员</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasSelection ? '批量移除成员' : '请先选择成员'}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <OrganizationBatchRemoveDialog
        organizationId={organizationId}
        members={selectedMembers}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        onRemoved={onClearSelection}
      />
    </>
  )
}
