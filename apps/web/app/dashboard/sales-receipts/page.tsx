"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { ReceiptIcon, Search01Icon, EyeIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"

interface SaleReceipt {
  id: string
  saleNumber: string
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  customer?: { name: string }
  cashier?: { name: string }
}

export default function SalesReceiptsPage() {
  const { branchParam } = useBranch()
  const [receipts, setReceipts] = useState<SaleReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/sales", branchParam))
        if (res.success) setReceipts(res.data.sales || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase()
    return r.saleNumber?.toLowerCase().includes(q) || r.customer?.name?.toLowerCase().includes(q)
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sales Receipts" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Receipts</h1>
          <p className="text-sm text-muted-foreground">View all completed sales receipts</p>
        </div>
        <Link href="/dashboard/pos">
          <Button className="gap-2">
            <HugeiconsIcon icon={ReceiptIcon} strokeWidth={2} className="size-4" /> New Sale
          </Button>
        </Link>
      </div>

      <div className="relative w-full sm:w-64">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search receipts..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <HugeiconsIcon icon={ReceiptIcon} strokeWidth={2} className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              No sales receipts found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.saleNumber}</TableCell>
                    <TableCell>{r.customer?.name || "Walk-in"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.cashier?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                    <TableCell className="capitalize">{r.paymentMethod || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatTZS(r.total)}</TableCell>
                    <TableCell><Badge variant={r.status === "completed" ? "default" : "secondary"} className="capitalize">{r.status}</Badge></TableCell>
                    <TableCell>
                      <Link href={`/dashboard/sales/${r.id}`}>
                        <Button variant="ghost" size="icon"><HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" /></Button>
                      </Link>
                    </TableCell>
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
