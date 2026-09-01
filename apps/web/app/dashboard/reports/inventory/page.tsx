"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, Package02Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"

export default function InventoryReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/reports/inventory")
        if (res.success) setData(res.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Reports", href: "/dashboard/reports" },
      { label: "Inventory Report" },
    ]}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Report</h1>
          <p className="text-sm text-muted-foreground">Stock valuation, turnover, and low stock alerts</p>
        </div>
        <Button variant="outline"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Total Items</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{data?.totalItems || 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Stock Value (Cost)</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{formatTZS(data?.stockValue || 0)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Retail Value</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{formatTZS(data?.retailValue || 0)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Low Stock Items</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold text-destructive">{data?.lowStockCount || 0}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
          <CardDescription>Products at or below reorder level</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data?.lowStock?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lowStock.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.variant?.product?.name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.variant?.sku || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.branch?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.variant?.reorderLevel || 0}</TableCell>
                    <TableCell>
                      {item.quantity === 0 ? <Badge variant="destructive">Out</Badge> : <Badge variant="secondary">Low</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">No low stock items</div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
