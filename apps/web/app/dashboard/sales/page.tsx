"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { ShoppingBag01Icon, Search01Icon, PlusIcon, EyeIcon, PrinterIcon, DownloadIcon, ReturnRequestIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime } from "@/lib/api"
import type { Sale } from "@/lib/types"

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchSales() {
      try {
        const res = await api.get("/sales")
        if (res.success) setSales(res.data.sales || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [])

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase()
    return s.saleNumber?.toLowerCase().includes(q) || s.customer?.name?.toLowerCase().includes(q)
  })

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)

  function statusBadge(status: string) {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default", completed: "default", pending: "secondary", cancelled: "destructive", refunded: "destructive",
    }
    return <Badge variant={map[status] || "secondary"} className="capitalize">{status}</Badge>
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sales", href: "/dashboard/sales" }, { label: "All Sales" }]}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">All completed sales transactions</p>
        </div>
        <Link href="/dashboard/pos"><Button><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Sale</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-2xl font-bold">{loading ? "—" : formatTZS(totalRevenue)}</span>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="text-2xl font-bold">{loading ? "—" : sales.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Average Sale</span>
              <span className="text-2xl font-bold">{loading ? "—" : formatTZS(sales.length ? totalRevenue / sales.length : 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Sales</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </div>
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search receipt..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-48 pl-8" />
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
              <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No sales found</p>
                <p className="text-sm text-muted-foreground">Try changing your filters or complete a sale from the POS</p>
              </div>
              <Link href="/dashboard/pos"><Button size="sm"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Sale</Button></Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-medium">{sale.saleNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.customer?.name || "Walk-in"}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.branch?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{formatTZS(sale.total)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(sale.payments || []).map((p) => (
                          <Badge key={p.id} variant="outline" className="text-xs capitalize">{p.method}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(sale.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(sale.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/sales/${sale.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" /></Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="size-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"><HugeiconsIcon icon={ReturnRequestIcon} strokeWidth={2} className="size-4" /></Button>
                      </div>
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
