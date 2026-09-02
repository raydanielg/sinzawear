"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
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
  TrendingUpIcon,
  TrendingDownIcon,
  Wallet01Icon,
  ReceiptIcon,
  Add01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
  Store02Icon,
  File02Icon,
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

  const maxBranchSales = Math.max(...branches.map((b) => b._count?.sales || 0), 1)

  const statCards = [
    { title: "Today's Sales", value: stats ? formatTZS(stats.todaySales) : "—", sub: stats ? `${stats.todayTransactions} transactions` : "", icon: Cash01Icon, trend: "up", trendValue: "+12.5%" },
    { title: "Total Sales", value: stats ? formatTZS(stats.totalSales) : "—", sub: "All time", icon: ShoppingBag01Icon, trend: "up", trendValue: "+8.2%" },
    { title: "Gross Profit", value: stats ? formatTZS(stats.grossProfit) : "—", sub: "Revenue minus cost", icon: TrendingUpIcon, trend: "up", trendValue: "+5.1%" },
    { title: "Net Profit", value: stats ? formatTZS(stats.netProfit) : "—", sub: "After expenses", icon: Wallet01Icon, trend: (stats?.netProfit ?? 0) >= 0 ? "up" : "down", trendValue: (stats?.netProfit ?? 0) >= 0 ? "+3.4%" : "-2.1%" },
    { title: "Total Products", value: stats ? String(stats.totalProducts) : "—", sub: "In catalog", icon: Package02Icon, trend: "neutral", trendValue: "" },
    { title: "Low Stock", value: stats ? String(stats.lowStock) : "—", sub: "Need restocking", icon: Alert02Icon, trend: "down", trendValue: "Attention" },
    { title: "Out of Stock", value: stats ? String(stats.outOfStock) : "—", sub: "Unavailable", icon: CancelCircleIcon, trend: "down", trendValue: "Critical" },
    { title: "Customers", value: stats ? String(stats.customers) : "—", sub: "Registered", icon: UsersIcon, trend: "up", trendValue: "+15.3%" },
  ]

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
  const userName = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.name || "Admin" : "Admin"

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }, { label: "Overview" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Stat Cards - 2 column grid, plain icons */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  {loading ? <Skeleton className="h-7 w-28" /> : <span className="text-2xl font-bold tracking-tight">{stat.value}</span>}
                  {stat.sub && <span className="text-xs text-muted-foreground">{stat.sub}</span>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <HugeiconsIcon
                    icon={stat.icon}
                    strokeWidth={2}
                    className={cn(
                      "size-6",
                      stat.trend === "down" ? "text-destructive" : stat.trend === "neutral" ? "text-muted-foreground" : "text-primary"
                    )}
                  />
                  {stat.trendValue && (
                    <span className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      stat.trend === "down" ? "text-destructive" : stat.trend === "neutral" ? "text-muted-foreground" : "text-emerald-600"
                    )}>
                      {stat.trend === "up" && <HugeiconsIcon icon={TrendingUpIcon} strokeWidth={2} className="size-3" />}
                      {stat.trend === "down" && <HugeiconsIcon icon={TrendingDownIcon} strokeWidth={2} className="size-3" />}
                      {stat.trendValue}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales trend bar chart + Branch performance with progress bars */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </div>
              <HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-end justify-around gap-2">
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <Skeleton key={i} className="w-full" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-end justify-around gap-2">
                {[
                  { day: "Mon", val: 45 },
                  { day: "Tue", val: 68 },
                  { day: "Wed", val: 52 },
                  { day: "Thu", val: 85 },
                  { day: "Fri", val: 72 },
                  { day: "Sat", val: 95 },
                  { day: "Sun", val: 60 },
                ].map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all hover:from-primary/60 hover:to-primary"
                        style={{ height: `${d.val}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Performance with Progress Bars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Branch Performance</CardTitle>
                <CardDescription>Sales by location</CardDescription>
              </div>
              <HugeiconsIcon icon={TrendingUpIcon} strokeWidth={2} className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : branches.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No branches found</div>
            ) : (
              branches.map((branch) => {
                const sales = branch._count?.sales || 0
                const pct = Math.round((sales / maxBranchSales) * 100)
                return (
                  <div key={branch.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{branch.name}</span>
                      <span className="text-xs text-muted-foreground">{sales} orders</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales + Low Stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest transactions</CardDescription>
              </div>
              <HugeiconsIcon icon={ReceiptIcon} strokeWidth={2} className="size-5 text-muted-foreground" />
            </div>
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
              <div className="overflow-x-auto">
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
                    <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/dashboard/sales/${sale.id}`}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{sale.cashier?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{sale.items?.length || 0} items</TableCell>
                      <TableCell className="font-medium">{formatTZS(sale.total)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(sale.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>Products running low</CardDescription>
              </div>
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">All products are well stocked</div>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-primary" />
          <div>
            <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">Jump straight to common tasks</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "New Sale", desc: "Point of Sale", href: "/dashboard/pos", icon: Cash01Icon, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Add Product", desc: "Create new item", href: "/dashboard/products/new", icon: Shirt01Icon, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "Inventory", desc: "Check stock levels", href: "/dashboard/inventory", icon: Package02Icon, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "New Purchase", desc: "Record purchase", href: "/dashboard/purchases/new", icon: CoinsIcon, color: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
            { label: "Reports", desc: "View analytics", href: "/dashboard/reports", icon: ChartIcon, color: "from-rose-500 to-rose-600", bg: "bg-rose-50 dark:bg-rose-950/40" },
            { label: "Customers", desc: "Manage profiles", href: "/dashboard/customers", icon: UsersIcon, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <div className={cn("group relative flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer overflow-hidden", action.bg)}>
                <div className={cn("flex size-11 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm", action.color)}>
                  <HugeiconsIcon icon={action.icon} strokeWidth={2} className="size-6" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold leading-tight">{action.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{action.desc}</span>
                </div>
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
