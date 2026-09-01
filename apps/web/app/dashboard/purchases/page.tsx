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
import { PlusIcon, PackageReceiveIcon, Search01Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate } from "@/lib/api"
import type { Purchase } from "@/lib/types"

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const res = await api.get("/purchases")
        if (res.success) setPurchases(res.data.purchases || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchPurchases()
  }, [])

  const filtered = purchases.filter((p) => {
    const q = search.toLowerCase()
    return p.purchaseNo?.toLowerCase().includes(q) || p.supplier?.name?.toLowerCase().includes(q)
  })

  function statusBadge(status: string) {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      received: "default", completed: "default", pending: "secondary", ordered: "secondary", cancelled: "destructive",
    }
    return <Badge variant={map[status] || "secondary"} className="capitalize">{status}</Badge>
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Purchasing", href: "/dashboard/purchases" }, { label: "Purchases" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground">Stock received from suppliers</p>
        </div>
        <Link href="/dashboard/purchases/new"><Button><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Purchase</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Purchases</CardTitle>
              <CardDescription>Goods received notes and supplier invoices</CardDescription>
            </div>
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search PO or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-48 pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No purchases found</p>
                <p className="text-sm text-muted-foreground">Create a purchase order to receive stock</p>
              </div>
              <Link href="/dashboard/purchases/new"><Button size="sm"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Purchase</Button></Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-medium">{p.purchaseNo}</TableCell>
                    <TableCell>{p.supplier?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.branch?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.items?.length || 0}</TableCell>
                    <TableCell className="font-medium">{formatTZS(p.totalAmount)}</TableCell>
                    <TableCell>
                      {p.balance > 0 ? <span className="text-destructive font-medium">{formatTZS(p.balance)}</span> : <Badge variant="default">Paid</Badge>}
                    </TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
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
