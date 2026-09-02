"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ReturnRequestIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime, withBranch } from "@/lib/api"
import type { SaleReturn } from "@/lib/types"
import { useBranch } from "@/lib/branch-context"

export default function ReturnsPage() {
  const { branchParam } = useBranch()
  const [returns, setReturns] = useState<SaleReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchReturns() {
      try {
        const res = await api.get(withBranch("/sales/returns", branchParam))
        if (res.success) setReturns(res.data.returns || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchReturns()
  }, [branchParam])

  const filtered = returns.filter((r) => {
    const q = search.toLowerCase()
    return r.returnNumber?.toLowerCase().includes(q)
  })

  function statusBadge(status: string) {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default", approved: "default", pending: "secondary", rejected: "destructive",
    }
    return <Badge variant={map[status] || "secondary"} className="capitalize">{status}</Badge>
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sales", href: "/dashboard/sales" },
      { label: "Returns" },
    ]}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Returns</h1>
        <p className="text-sm text-muted-foreground">Manage product returns and refunds</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Returns</CardTitle>
              <CardDescription>Return and refund history</CardDescription>
            </div>
            <div className="relative w-full sm:w-48">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search receipt..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={ReturnRequestIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No returns found</p>
                <p className="text-sm text-muted-foreground">Returns will appear here when customers return products</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Original Sale</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ret) => (
                  <TableRow key={ret.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-medium">{ret.returnNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{ret.saleId}</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="font-medium">{formatTZS(ret.refundAmount)}</TableCell>
                    <TableCell className="text-muted-foreground">{ret.reason}</TableCell>
                    <TableCell>{statusBadge(ret.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(ret.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
