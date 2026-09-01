"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, ChartIcon, CoinsIcon, Wallet01Icon, TrendingUpIcon, TrendingDownIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface PnLData {
  revenue: number
  cogs: number
  grossProfit: number
  totalExpenses: number
  netProfit: number
  profitMargin: string
}

export default function AccountingPage() {
  const [pnl, setPnl] = useState<PnLData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (fromDate) params.set("from", fromDate)
        if (toDate) params.set("to", toDate)
        const res = await api.get(`/reports/profit-loss${params.toString() ? `?${params}` : ""}`)
        if (res.success) setPnl(res.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [fromDate, toDate])

  function exportPDF() {
    if (!pnl) return
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pageWidth / 2, 20, { align: "center" })
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text("Profit & Loss Statement", pageWidth / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Period: ${fromDate || "All time"} to ${toDate || "Today"}`, pageWidth / 2, 35, { align: "center" })
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 41, { align: "center" })

    autoTable(doc, {
      startY: 50,
      head: [["Description", "Amount (TZS)"]],
      body: [
        ["Revenue", formatTZS(pnl.revenue)],
        ["Cost of Goods Sold (COGS)", `(${formatTZS(pnl.cogs)})`],
        ["Gross Profit", formatTZS(pnl.grossProfit)],
        ["Operating Expenses", `(${formatTZS(pnl.totalExpenses)})`],
        ["Net Profit", formatTZS(pnl.netProfit)],
      ],
      foot: [["Profit Margin", `${pnl.profitMargin}%`]],
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 11 },
      footStyles: { fillColor: [240, 240, 250], textColor: 0, fontSize: 11, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: "right" } },
      margin: { left: 15, right: 15 },
    })

    doc.save(`PnL_Statement_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const chartData = pnl ? [
    { name: "Revenue", amount: pnl.revenue, fill: "hsl(var(--chart-2))" },
    { name: "COGS", amount: pnl.cogs, fill: "hsl(var(--destructive))" },
    { name: "Gross Profit", amount: pnl.grossProfit, fill: "hsl(var(--primary))" },
    { name: "Expenses", amount: pnl.totalExpenses, fill: "hsl(var(--chart-4))" },
    { name: "Net Profit", amount: pnl.netProfit, fill: "hsl(var(--chart-3))" },
  ] : []

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Finance", href: "/dashboard/expenses" }, { label: "Accounting" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
          <p className="text-sm text-muted-foreground">Profit & Loss statement and financial overview</p>
        </div>
        <Button variant="outline" onClick={exportPDF} disabled={loading || !pnl}>
          <HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export PDF
        </Button>
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
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Revenue</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-xl font-bold sm:text-2xl">{formatTZS(pnl?.revenue || 0)}</span>}
            </div>
            <HugeiconsIcon icon={TrendingUpIcon} strokeWidth={2} className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">COGS</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-xl font-bold sm:text-2xl text-destructive">{formatTZS(pnl?.cogs || 0)}</span>}
            </div>
            <HugeiconsIcon icon={TrendingDownIcon} strokeWidth={2} className="size-6 text-destructive" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Gross Profit</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-xl font-bold sm:text-2xl text-primary">{formatTZS(pnl?.grossProfit || 0)}</span>}
            </div>
            <HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Net Profit</span>
              {loading ? <Skeleton className="h-8 w-24" /> : <span className="text-xl font-bold sm:text-2xl text-primary">{formatTZS(pnl?.netProfit || 0)}</span>}
              {!loading && pnl && <span className="text-xs text-muted-foreground">{pnl.profitMargin}% margin</span>}
            </div>
            <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-6 text-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>P&L Statement</CardTitle>
            <CardDescription>Full profit and loss breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                  <span className="text-sm font-medium">Revenue</span>
                  <span className="text-lg font-bold sm:text-xl">{formatTZS(pnl?.revenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                  <span className="text-sm font-medium">Cost of Goods Sold</span>
                  <span className="text-lg font-bold text-destructive sm:text-xl">-{formatTZS(pnl?.cogs || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                  <span className="text-sm font-medium">Gross Profit</span>
                  <span className="text-lg font-bold text-primary sm:text-xl">{formatTZS(pnl?.grossProfit || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                  <span className="text-sm font-medium">Operating Expenses</span>
                  <span className="text-lg font-bold text-destructive sm:text-xl">-{formatTZS(pnl?.totalExpenses || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/10 p-3 sm:p-4">
                  <span className="font-bold">Net Profit</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary sm:text-2xl">{formatTZS(pnl?.netProfit || 0)}</span>
                    {pnl?.profitMargin && <p className="text-xs text-muted-foreground">{pnl.profitMargin}% margin</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Visualization</CardTitle>
            <CardDescription>Revenue vs costs comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatTZS(Number(v) || 0)} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Summary</CardTitle>
          <CardDescription>Simplified cash flow indicator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-emerald-500">Inflow</Badge>
                  <span className="text-sm font-medium">Sales Revenue</span>
                </div>
                <span className="text-lg font-bold text-emerald-600 sm:text-xl">{formatTZS(pnl?.revenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Outflow</Badge>
                  <span className="text-sm font-medium">COGS + Expenses</span>
                </div>
                <span className="text-lg font-bold text-destructive sm:text-xl">-{formatTZS((pnl?.cogs || 0) + (pnl?.totalExpenses || 0))}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/10 p-3 sm:p-4">
                <span className="font-bold">Net Cash Flow</span>
                <span className="text-xl font-bold text-primary sm:text-2xl">{formatTZS(pnl?.netProfit || 0)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
