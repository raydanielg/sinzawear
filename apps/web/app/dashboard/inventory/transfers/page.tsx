"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusIcon, ArrowLeftRightIcon } from "@hugeicons/core-free-icons"
import { api, formatDateTime, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"

interface Transfer {
  id: string
  transferNo: string
  status: string
  note: string
  createdAt: string
  fromBranch?: { name: string }
  toBranch?: { name: string }
  items?: { id: string; quantity: number; variant?: { product?: { name: string }; color: string; size: string } }[]
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  received: "default",
  dispatched: "secondary",
  approved: "secondary",
  pending: "secondary",
  cancelled: "destructive",
}

export default function TransfersPage() {
  const { branchParam } = useBranch()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransfers() {
      try {
        const res = await api.get(withBranch("/inventory/transfers", branchParam))
        if (res.success) setTransfers(res.data.transfers || [])
      } catch {
        // API not connected
      } finally {
        setLoading(false)
      }
    }
    fetchTransfers()
  }, [branchParam])

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Inventory", href: "/dashboard/inventory" }, { label: "Transfers" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground">Move stock between branches</p>
        </div>
        <Button>
          <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" />
          New Transfer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transfers</CardTitle>
          <CardDescription>Branch-to-branch stock movements</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={ArrowLeftRightIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No transfers yet</p>
                <p className="text-sm text-muted-foreground">Create a transfer to move stock between branches</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-6 py-3 font-medium text-muted-foreground">Transfer #</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">From</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">To</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Items</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium font-mono text-xs">{t.transferNo}</td>
                      <td className="px-6 py-3">{t.fromBranch?.name || "—"}</td>
                      <td className="px-6 py-3">{t.toBranch?.name || "—"}</td>
                      <td className="px-6 py-3 text-muted-foreground">{t.items?.length || 0} items</td>
                      <td className="px-6 py-3">
                        <Badge variant={statusVariant[t.status] || "secondary"} className="capitalize">{t.status}</Badge>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{formatDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
