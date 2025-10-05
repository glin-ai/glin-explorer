import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonTable({ rows = 15, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50 border-b">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export { Skeleton, SkeletonTable, SkeletonTableRow, SkeletonCard }