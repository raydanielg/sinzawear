import { Skeleton } from "@workspace/ui/components/skeleton"
import { Card, CardContent } from "@workspace/ui/components/card"

export default function AuthSkeleton() {
  return (
    <div className="relative flex min-h-svh items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/5" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="overflow-hidden p-0 shadow-2xl">
          <CardContent className="p-0">
            <div className="p-6 md:p-8">
              <div className="flex flex-col items-center gap-2 text-center">
                <Skeleton className="size-16 rounded-2xl" />
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="mx-auto h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
