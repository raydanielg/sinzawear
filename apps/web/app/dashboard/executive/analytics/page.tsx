"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartIcon, CoinsIcon, Wallet01Icon, File02Icon, ReceiptIcon, RefreshIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts"

interface Summary {
  revenue: number
  expenditures: number
  invoices: { total: number; paid: number; unpaid: number }
  bills: { total: number; paid: number; unpaid: number }
}

interface MonthData {
  label: string
  cashIncoming: number
  cashOutgoing: number
  sales: number
  expenses: number
  netProfit: number
}

interface TopProduct {
  name: string
  revenue: number
  qty: number
}

interface AnalyticsData {
  summary: Summary
  monthly: MonthData[]
  topByRevenue: TopProduct[]
  topByQty: TopProduct[]
  comparison: { revenue: number; expenses: number } | null
}

function formatCompact(amount: number) {
  if (!amount && amount !== 0) return "0"
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(1)}k`
  return String(amount)
}

function formatTooltip(value: number) {
  return formatTZS(Number(value) || 0)
}

const CHART_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"]

export default function ExecutiveAnalyticsPage() {
  const { branches, branchParam } = useBranch()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [station, setStation] = useState("all")
  const [withComparison, setWithComparison] = useState("0")
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("year", year)
      if (station && station !== "all") params.set("branchId", station)
      params.set("withComparison", withComparison)
      const res = await api.get(`/reports/executive?${params.toString()}`)
      if (res.success) setData(res.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [year, station, withComparison])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleRefresh() {
    setRefreshing(true)
    fetchData().finally(() => {
      setTimeout(() => setRefreshing(false), 1000)
    })
  }

  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(String(y))
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Executive Analytics" },
    ]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Analytics</h1>
          <p className="text-sm text-muted-foreground">Financial statistics and performance overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filter Form */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Financial Year</label>
            <Select value={year} onValueChange={(v) => setYear(v ?? String(currentYear))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Station</label>
            <Select value={station} onValueChange={(v) => setStation(v ?? "all")}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Compare to Previous Period</label>
            <Select value={withComparison} onValueChange={(v) => setWithComparison(v ?? "0")}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No</SelectItem>
                <SelectItem value="1">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchData} disabled={loading} className="gap-2">
            <HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-4" />
            Submit
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="border-emerald-500/30">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Revenue</span>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <span className="text-2xl font-bold">{formatTZS(data?.summary.revenue || 0)}</span>
              )}
              {data?.comparison && (
                <span className="text-xs text-muted-foreground">
                  Prev: {formatCompact(data.comparison.revenue)}
                </span>
              )}
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="border-blue-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Invoices</span>
              <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
                <HugeiconsIcon icon={File02Icon} strokeWidth={2} className="size-6 text-blue-600" />
              </div>
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-28" /> : (
              <span className="text-2xl font-bold">{formatTZS(data?.summary.invoices.total || 0)}</span>
            )}
            {!loading && data && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600">Paid: {formatCompact(data.summary.invoices.paid)}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-red-600">Unpaid: {formatCompact(data.summary.invoices.unpaid)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenditures */}
        <Card className="border-red-500/30">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Expenditures</span>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <span className="text-2xl font-bold text-red-600">-{formatTZS(data?.summary.expenditures || 0)}</span>
              )}
              {data?.comparison && (
                <span className="text-xs text-muted-foreground">
                  Prev: -{formatCompact(data.comparison.expenses)}
                </span>
              )}
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-red-500/10">
              <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* Bills */}
        <Card className="border-amber-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Bills</span>
              <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
                <HugeiconsIcon icon={ReceiptIcon} strokeWidth={2} className="size-6 text-amber-600" />
              </div>
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-28" /> : (
              <span className="text-2xl font-bold">{formatTZS(data?.summary.bills.total || 0)}</span>
            )}
            {!loading && data && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600">Paid: {formatCompact(data.summary.bills.paid)}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-red-600">Unpaid: {formatCompact(data.summary.bills.unpaid)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Section */}
      <Card id="cash_flow_section">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a href="#cash_flow_section" className="font-medium text-primary">Cash Flow</a>
            <span className="text-muted-foreground">|</span>
            <a href="#sale_expense_section" className="text-muted-foreground hover:text-primary">Sales & Expenses</a>
            <span className="text-muted-foreground">|</span>
            <a href="#net_profit_section" className="text-muted-foreground hover:text-primary">Net Profit</a>
            <span className="text-muted-foreground">|</span>
            <a href="#offering_section" className="text-muted-foreground hover:text-primary">Product & Service</a>
          </div>
          <CardTitle>Cash Flow - Income & Outgoing</CardTitle>
          <CardDescription>Cash payments received and made</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cash Incoming */}
            <div>
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold">Cash Incoming</h3>
                  <p className="text-xs text-muted-foreground">Cash / Payments received</p>
                </div>
                <span className="text-sm font-bold italic">
                  Total: {formatTZS(data?.monthly.reduce((s, m) => s + m.cashIncoming, 0) || 0)}
                </span>
              </div>
              {loading ? <Skeleton className="h-72 w-full" /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.monthly || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                      <Tooltip formatter={formatTooltip} />
                      <Line type="monotone" dataKey="cashIncoming" stroke="#10b981" strokeWidth={2} name="Cash Incoming" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Cash Outgoing */}
            <div>
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold">Cash Outgoing</h3>
                  <p className="text-xs text-muted-foreground">Payments made</p>
                </div>
                <span className="text-sm font-bold italic">
                  Total: {formatTZS(data?.monthly.reduce((s, m) => s + m.cashOutgoing, 0) || 0)}
                </span>
              </div>
              {loading ? <Skeleton className="h-72 w-full" /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.monthly || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                      <Tooltip formatter={formatTooltip} />
                      <Line type="monotone" dataKey="cashOutgoing" stroke="#ef4444" strokeWidth={2} name="Cash Outgoing" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales & Expenses Section */}
      <Card id="sale_expense_section">
        <CardHeader>
          <CardTitle>Sales & Expenses</CardTitle>
          <CardDescription>Sales & Expenses transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales */}
            <div>
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold">Sales</h3>
                  <p className="text-xs text-muted-foreground">Monthly sales made</p>
                </div>
                <span className="text-sm font-bold italic">
                  Total: {formatTZS(data?.monthly.reduce((s, m) => s + m.sales, 0) || 0)}
                </span>
              </div>
              {loading ? <Skeleton className="h-72 w-full" /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.monthly || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                      <Tooltip formatter={formatTooltip} />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Expenses */}
            <div>
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold">Expenses</h3>
                  <p className="text-xs text-muted-foreground">Monthly expenses incurred</p>
                </div>
                <span className="text-sm font-bold italic">
                  Total: ({formatTZS(data?.monthly.reduce((s, m) => s + m.expenses, 0) || 0)})
                </span>
              </div>
              {loading ? <Skeleton className="h-72 w-full" /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.monthly || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                      <Tooltip formatter={formatTooltip} />
                      <Line type="monotone" dataKey="expenses" stroke="#f97316" strokeWidth={2} name="Expenses" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit Section */}
      <Card id="net_profit_section">
        <CardHeader>
          <CardTitle>Monthly Net Profit (All Sales)</CardTitle>
          <CardDescription>Net Profit Earnings from all sales and other income(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-end rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm font-bold italic">
              Total: {formatTZS(data?.monthly.reduce((s, m) => s + m.netProfit, 0) || 0)}
            </span>
          </div>
          {loading ? <Skeleton className="h-80 w-full" /> : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip formatter={formatTooltip} />
                  <Line type="monotone" dataKey="netProfit" stroke="#8b5cf6" strokeWidth={2} name="Net Profit" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product & Service Section */}
      <Card id="offering_section">
        <CardHeader>
          <CardTitle>Product & Service</CardTitle>
          <CardDescription>Top products and services by revenue and quantity sold</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Top by Revenue */}
          <div>
            <div className="mb-3 rounded-lg bg-muted/50 px-4 py-3">
              <h3 className="text-sm font-bold">Top Product & Services in Revenue</h3>
              <p className="text-xs text-muted-foreground">Top products/services based on revenue</p>
            </div>
            {loading ? <Skeleton className="h-80 w-full" /> : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.topByRevenue || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip formatter={formatTooltip} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {(data?.topByRevenue || []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top by Qty */}
          <div>
            <div className="mb-3 rounded-lg bg-muted/50 px-4 py-3">
              <h3 className="text-sm font-bold">Top Product & Services in Qty Sold</h3>
              <p className="text-xs text-muted-foreground">Top products/services based on quantity sold</p>
            </div>
            {loading ? <Skeleton className="h-80 w-full" /> : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.topByQty || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip formatter={(v: number) => String(v)} />
                    <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                      {(data?.topByQty || []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
