"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShoppingBag01Icon,
  Shirt01Icon,
  UsersIcon,
  CoinsIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Package02Icon,
  Cash01Icon,
  ChartIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime } from "@/lib/api"
import type { DashboardData, Sale, BranchStock } from "@/lib/types"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [lowStock, setLowStock] = useState<BranchStock[]>([])
  const [branches, setBranches] = useState<{ id: string; name: string; _count?: { sales: number } }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, salesRes, lowStockRes, branchRes] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/sales"),
          api.get("/inventory/low-stock"),
          api.get("/branches"),
        ])
        if (dashRes.success) setStats(dashRes.data)
        if (salesRes.success) setRecentSales((salesRes.data.sales || []).slice(0, 6))
        if (lowStockRes.success) setLowStock(lowStockRes.data.lowStock || [])
        if (branchRes.success) setBranches(branchRes.data.branches || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { title: "Today's Sales", value: stats ? formatTZS(stats.todaySales) : "—", sub: stats ? `${stats.todayTransactions} transactions` : "", icon: <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} className="size-5" />, color: "text-primary" },
    { title: "Total Sales", value: stats ? formatTZS(stats.totalSales) : "—", icon: <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-5" />, color: "text-primary" },
    { title: "Gross Profit", value: stats ? formatTZS(stats.grossProfit) : "—", icon: <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-5" />, color: "text-primary" },
    { title: "Total Stock", value: stats ? String(stats.totalProducts) : "—", icon: <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-5" />, color: "text-primary" },
    { title: "Low Stock", value: stats ? String(stats.lowStock) : "—", icon: <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />, color: "text-destructive" },
    { title: "Out of Stock", value: stats ? String(stats.outOfStock) : "—", icon: <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-5" />, color: "text-destructive" },
    { title: "Customers", value: stats ? String(stats.customers) : "—", icon: <HugeiconsIcon icon={UsersIcon} strokeWidth={2} className="size-5" />, color: "text-primary" },
    { title: "Net Profit", value: stats ? formatTZS(stats.netProfit) : "—", icon: <HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-5" />, color: "text-primary" },
  ]

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
  const userName = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.name || "Admin" : "Admin"

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }, { label: "Overview" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}, {userName}</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <Link href="/dashboard/pos">
          <Button>
            <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} className="size-4" />
            New Sale
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{stat.title}</span>
                {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-2xl font-bold">{stat.value}</span>}
                {stat.sub && <span className="text-xs text-muted-foreground">{stat.sub}</span>}
              </div>
              <div className={`flex size-12 items-center justify-center rounded-xl bg-primary/10 ${stat.color}`}>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions from your store</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentSales.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No sales yet. Start selling from the POS.
                <div className="mt-3"><Link href="/dashboard/pos"><Button size="sm"><HugeiconsIcon icon={Cash01Icon} strokeWidth={2} className="size-4" /> New Sale</Button></Link></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{sale.cashier?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{sale.items?.length || 0} items</TableCell>
                      <TableCell className="font-medium">{formatTZS(sale.total)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(sale.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Branch</CardTitle>
            <CardDescription>Performance across locations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : branches.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No branches found</div>
            ) : (
              branches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{branch.name}</p>
                      <p className="text-xs text-muted-foreground">{branch._count?.sales || 0} orders</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Products running low</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">All products are well stocked</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.slice(0, 8).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.variant?.product?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{item.variant?.sku || "—"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.quantity === 0 ? (
                          <Badge variant="destructive">Out</Badge>
                        ) : item.quantity <= 3 ? (
                          <Badge variant="destructive">Critical</Badge>
                        ) : (
                          <Badge variant="secondary">Low</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/pos"><Button variant="outline" className="w-full justify-start"><HugeiconsIcon icon={Cash01Icon} strokeWidth={2} className="size-4" />New Sale (POS)</Button></Link>
            <Link href="/dashboard/products/new"><Button variant="outline" className="w-full justify-start"><HugeiconsIcon icon={Shirt01Icon} strokeWidth={2} className="size-4" />Add Product</Button></Link>
            <Link href="/dashboard/inventory"><Button variant="outline" className="w-full justify-start"><HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-4" />Check Inventory</Button></Link>
            <Link href="/dashboard/purchases/new"><Button variant="outline" className="w-full justify-start"><HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-4" />New Purchase</Button></Link>
            <Link href="/dashboard/reports"><Button variant="outline" className="w-full justify-start"><HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-4" />View Reports</Button></Link>
            <Link href="/dashboard/customers"><Button variant="outline" className="w-full justify-start"><HugeiconsIcon icon={UsersIcon} strokeWidth={2} className="size-4" />Customers</Button></Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
