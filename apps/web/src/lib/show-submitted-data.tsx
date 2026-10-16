import { toast } from '@zen/ui'

export function showSubmittedData(
  data: unknown,
  title: string = 'You submitted the following values:'
) {
  toast.add({
    title,
    description: (
      <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    )
  })
}
