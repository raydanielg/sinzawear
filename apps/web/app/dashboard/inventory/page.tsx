"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Package02Icon, Alert02Icon, CancelCircleIcon, Search01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import type { BranchStock } from "@/lib/types"
import { useBranch } from "@/lib/branch-context"

export default function InventoryPage() {
  const { branchParam } = useBranch()
  const [stocks, setStocks] = useState<BranchStock[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await api.get(withBranch("/inventory", branchParam))
        if (res.success) setStocks(res.data.stocks || res.data.stock || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchStock()
  }, [branchParam])

  const filtered = stocks.filter((s) => {
    const q = search.toLowerCase()
    return s.variant?.product?.name?.toLowerCase().includes(q) || s.variant?.sku?.toLowerCase().includes(q)
  })

  const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0)
  const stockValue = stocks.reduce((sum, s) => sum + s.quantity * (s.variant?.costPrice || 0), 0)
  const retailValue = stocks.reduce((sum, s) => sum + s.quantity * (s.variant?.sellingPrice || 0), 0)
  const lowStock = stocks.filter((s) => s.quantity <= (s.variant?.reorderLevel || 0) && s.quantity > 0)
  const outOfStock = stocks.filter((s) => s.quantity === 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Inventory" }]}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">Branch-specific stock levels and valuation</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Stock</span>
              <span className="text-2xl font-bold">{totalStock}</span>
              <span className="text-xs text-muted-foreground">pieces across all branches</span>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Stock Value (Cost)</span>
              <span className="text-2xl font-bold">{formatTZS(stockValue)}</span>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Low Stock</span>
              <span className="text-2xl font-bold text-destructive">{lowStock.length}</span>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Out of Stock</span>
              <span className="text-2xl font-bold text-destructive">{outOfStock.length}</span>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stock by Branch</CardTitle>
              <CardDescription>Current inventory levels across all branches</CardDescription>
            </div>
            <div className="relative w-full sm:w-48">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No stock data. Add products and create purchases to build inventory.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">{stock.variant?.product?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{stock.variant?.color?.name} {stock.variant?.size?.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{stock.variant?.sku || "—"}</TableCell>
                    <TableCell>{stock.branch?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{stock.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{formatTZS(stock.variant?.costPrice || 0)}</TableCell>
                    <TableCell className="font-medium">{formatTZS(stock.variant?.sellingPrice || 0)}</TableCell>
                    <TableCell>
                      {stock.quantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : stock.quantity <= (stock.variant?.reorderLevel || 0) ? (
                        <Badge variant="secondary">Low Stock</Badge>
                      ) : (
                        <Badge variant="default">In Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
