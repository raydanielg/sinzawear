"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartIcon, CoinsIcon, Package02Icon, ShoppingBag01Icon, Store01Icon, Download04Icon, File02Icon, StarAwardIcon, UserGroupIcon, Wallet01Icon, BanknoteIcon, TruckIcon, Book01Icon, MapIcon, ReceiptIcon, Cash01Icon, TargetIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import type { Branch } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useBranch } from "@/lib/branch-context"

interface PnLData {
  revenue: number
  cogs: number
  grossProfit: number
  totalExpenses: number
  netProfit: number
  profitMargin: string
}

export default function ReportsPage() {
  const { branchParam } = useBranch()
  const [pnl, setPnl] = useState<PnLData | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [branchId, setBranchId] = useState("")

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await api.get("/branches")
        if (res.success) setBranches(res.data.branches || [])
      } catch {}
    }
    fetchBranches()
  }, [])

  useEffect(() => {
    async function fetchReports() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (fromDate) params.set("from", fromDate)
        if (toDate) params.set("to", toDate)
        if (branchId) params.set("branchId", branchId)
        if (!branchId && branchParam) params.set("branchId", branchParam)
        const res = await api.get(`/reports/profit-loss${params.toString() ? `?${params}` : ""}`)
        if (res.success) setPnl(res.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [fromDate, toDate, branchId, branchParam])

  const reportLinks = [
    { label: "Sales Report", href: "/dashboard/reports/sales", icon: ShoppingBag01Icon, desc: "Sales by period, payment method, cashier" },
    { label: "Profit & Loss", href: "/dashboard/reports/profit", icon: ChartIcon, desc: "Revenue, COGS, expenses, net profit" },
    { label: "Inventory Report", href: "/dashboard/reports/inventory", icon: Package02Icon, desc: "Stock valuation, turnover, low stock" },
    { label: "Purchase Report", href: "/dashboard/reports/purchases", icon: CoinsIcon, desc: "Purchases by supplier, branch, period" },
    { label: "Branch Report", href: "/dashboard/reports/branches", icon: Store01Icon, desc: "Compare performance across branches" },
  ]

  const reportCategories = [
    { label: "My Favourite Reports", href: "/dashboard/reports", icon: StarAwardIcon, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900" },
    { label: "Accounting Reports", href: "/dashboard/accounting", icon: Book01Icon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900" },
    { label: "Budget Reports", href: "/dashboard/reports", icon: TargetIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900" },
    { label: "Employee Incentive Program Reports", href: "/dashboard/executive/hr-analytics", icon: StarAwardIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900" },
    { label: "Employee Reports", href: "/dashboard/hr/employees", icon: UserGroupIcon, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900" },
    { label: "Expense Reports", href: "/dashboard/expenses", icon: Wallet01Icon, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900" },
    { label: "Fleet Reports", href: "/dashboard/reports", icon: TruckIcon, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900" },
    { label: "Payroll Reports", href: "/dashboard/hr/payroll", icon: Cash01Icon, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900" },
    { label: "POS: Stock & Sales Reports", href: "/dashboard/reports/sales", icon: ReceiptIcon, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-900" },
    { label: "Project Reports", href: "/dashboard/reports", icon: MapIcon, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-200 dark:border-teal-900" },
    { label: "Sale Fulfillment Reports", href: "/dashboard/reports", icon: File02Icon, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900" },
    { label: "Sales Reports", href: "/dashboard/reports/sales", icon: ShoppingBag01Icon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900" },
    { label: "Stock Reports", href: "/dashboard/reports/inventory", icon: Package02Icon, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-900" },
  ]

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Financial and inventory analytics</p>
        </div>
        <Button variant="outline" onClick={() => {
          if (!pnl) return
          const doc = new jsPDF()
          const pw = doc.internal.pageSize.getWidth()
          doc.setFontSize(20); doc.setFont("helvetica", "bold")
          doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
          doc.setFontSize(14); doc.setFont("helvetica", "normal")
          doc.text("P&L Summary Report", pw / 2, 28, { align: "center" })
          doc.setFontSize(10)
          doc.text(`Period: ${fromDate || "All time"} to ${toDate || "Today"}`, pw / 2, 35, { align: "center" })
          doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 41, { align: "center" })
          autoTable(doc, {
            startY: 50,
            head: [["Description", "Amount (TZS)"]],
            body: [
              ["Revenue", formatTZS(pnl.revenue)],
              ["COGS", `(${formatTZS(pnl.cogs)})`],
              ["Gross Profit", formatTZS(pnl.grossProfit)],
              ["Operating Expenses", `(${formatTZS(pnl.totalExpenses)})`],
              ["Net Profit", formatTZS(pnl.netProfit)],
            ],
            foot: [["Profit Margin", `${pnl.profitMargin}%`]],
            theme: "striped",
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 15, right: 15 },
          })
          doc.save(`PnL_Summary_${new Date().toISOString().split("T")[0]}.pdf`)
        }}><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export PDF</Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4 sm:gap-4">
          <div className="space-y-1">
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-full sm:w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-full sm:w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Branch</Label>
            <select className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-40" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Revenue</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-2xl font-bold">{formatTZS(pnl?.revenue || 0)}</span>}
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">COGS</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-2xl font-bold">{formatTZS(pnl?.cogs || 0)}</span>}
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Gross Profit</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-2xl font-bold text-primary">{formatTZS(pnl?.grossProfit || 0)}</span>}
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Net Profit</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-2xl font-bold text-primary">{formatTZS(pnl?.netProfit || 0)}</span>}
              {!loading && pnl && <span className="text-xs text-muted-foreground">{pnl.profitMargin}% margin</span>}
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories Grid */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-primary" />
          <div>
            <h2 className="text-lg font-bold tracking-tight">Report Categories</h2>
            <p className="text-sm text-muted-foreground">Browse reports by category</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reportCategories.map((cat) => (
            <Link key={cat.label} href={cat.href}>
              <div className={`group flex items-center gap-3 rounded-xl border ${cat.border} ${cat.bg} p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}>
                <div className={`flex size-10 items-center justify-center rounded-lg bg-background shadow-sm`}>
                  <HugeiconsIcon icon={cat.icon} strokeWidth={2} className={`size-5 ${cat.color}`} />
                </div>
                <span className="text-sm font-semibold leading-tight">{cat.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Breakdown</CardTitle>
            <CardDescription>Revenue, costs, and profit analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Revenue</span>
                  <span className="font-bold">{formatTZS(pnl?.revenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Cost of Goods Sold (COGS)</span>
                  <span className="font-bold text-destructive">-{formatTZS(pnl?.cogs || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <span className="text-sm font-medium">Gross Profit</span>
                  <span className="font-bold text-primary">{formatTZS(pnl?.grossProfit || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Operating Expenses</span>
                  <span className="font-bold text-destructive">-{formatTZS(pnl?.totalExpenses || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/10 p-3">
                  <span className="font-bold">Net Profit</span>
                  <span className="text-xl font-bold text-primary">{formatTZS(pnl?.netProfit || 0)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
            <CardDescription>Generate detailed business reports</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {reportLinks.map((r) => (
              <Link key={r.href} href={r.href}>
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <HugeiconsIcon icon={r.icon} strokeWidth={2} className="size-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.desc}</span>
                  </div>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
