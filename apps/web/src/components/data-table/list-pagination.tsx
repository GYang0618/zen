'use no memo'

import {
  Button,
  cn,
  getPageNumbers,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft as DoubleArrowLeftIcon,
  ChevronsRight as DoubleArrowRightIcon
} from 'lucide-react'

export const LIST_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const

export type ListPaginationProps = {
  page: number
  pageCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: readonly number[]
  sizeLabel?: string
  className?: string
}

export function ListPagination({
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = LIST_PAGE_SIZE_OPTIONS,
  sizeLabel = '每页条数',
  className
}: ListPaginationProps) {
  const pageNumbers = getPageNumbers(page, pageCount)
  const canPreviousPage = page > 1
  const canNextPage = pageCount > 0 && page < pageCount

  return (
    <div
      className={cn(
        'flex items-center justify-between overflow-clip px-2',
        '@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4',
        className
      )}
      style={{ overflowClipMargin: 1 }}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex w-[100px] items-center justify-center text-sm font-medium @2xl/content:hidden">
          第 {page} 页 / 共 {pageCount} 页
        </div>
        <div className="flex items-center gap-2 @max-2xl/content:flex-row-reverse">
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={`${option}`}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="hidden text-sm font-medium sm:block">{sizeLabel}</p>
        </div>
      </div>

      <div className="flex items-center sm:space-x-6 lg:space-x-8">
        <div className="flex w-[120px] items-center justify-center text-sm font-medium @max-3xl/content:hidden">
          第 {page} 页 / 共 {pageCount} 页
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="size-8 p-0 @max-md/content:hidden"
            onClick={() => onPageChange(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">跳转至首页</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">上一页</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {pageNumbers.map((pageNumber, index) => (
            <div key={`${pageNumber}-${index}`} className="flex items-center">
              {pageNumber === '...' ? (
                <span className="px-1 text-sm text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={page === pageNumber ? 'default' : 'outline'}
                  className="h-8 min-w-8 px-2"
                  onClick={() => onPageChange(pageNumber as number)}
                >
                  <span className="sr-only">跳转至第 {pageNumber} 页</span>
                  {pageNumber}
                </Button>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">下一页</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0 @max-md/content:hidden"
            onClick={() => onPageChange(pageCount)}
            disabled={!canNextPage}
          >
            <span className="sr-only">跳转至末页</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
