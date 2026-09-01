"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, ChartIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function ProfitReportPage() {
  const [data, setData] = useState<any>(null)
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
        if (res.success) setData(res.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [fromDate, toDate])

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Reports", href: "/dashboard/reports" },
      { label: "Profit & Loss" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profit & Loss Report</h1>
          <p className="text-sm text-muted-foreground">Revenue, COGS, expenses, and net profit</p>
        </div>
        <Button variant="outline" onClick={() => {
          if (!data) return
          const doc = new jsPDF()
          const pw = doc.internal.pageSize.getWidth()
          doc.setFontSize(20); doc.setFont("helvetica", "bold")
          doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
          doc.setFontSize(14); doc.setFont("helvetica", "normal")
          doc.text("Profit & Loss Report", pw / 2, 28, { align: "center" })
          doc.setFontSize(10)
          doc.text(`Period: ${fromDate || "All time"} to ${toDate || "Today"}`, pw / 2, 35, { align: "center" })
          doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 41, { align: "center" })
          autoTable(doc, {
            startY: 50,
            head: [["Description", "Amount (TZS)"]],
            body: [
              ["Revenue", formatTZS(data.revenue || 0)],
              ["Cost of Goods Sold", `(${formatTZS(data.cogs || 0)})`],
              ["Gross Profit", formatTZS(data.grossProfit || 0)],
              ["Operating Expenses", `(${formatTZS(data.totalExpenses || 0)})`],
              ["Net Profit", formatTZS(data.netProfit || 0)],
            ],
            foot: [["Profit Margin", `${data.profitMargin || 0}%`]],
            theme: "striped",
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 15, right: 15 },
          })
          doc.save(`PnL_Report_${new Date().toISOString().split("T")[0]}.pdf`)
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
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>P&L Breakdown</CardTitle>
            <CardDescription>Full profit and loss statement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <span className="font-medium">Revenue</span>
                  <span className="text-xl font-bold">{formatTZS(data?.revenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <span className="font-medium">Cost of Goods Sold</span>
                  <span className="text-xl font-bold text-destructive">-{formatTZS(data?.cogs || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <span className="font-medium">Gross Profit</span>
                  <span className="text-xl font-bold text-primary">{formatTZS(data?.grossProfit || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <span className="font-medium">Operating Expenses</span>
                  <span className="text-xl font-bold text-destructive">-{formatTZS(data?.totalExpenses || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/10 p-4">
                  <span className="font-bold">Net Profit</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{formatTZS(data?.netProfit || 0)}</span>
                    {data?.profitMargin && <p className="text-xs text-muted-foreground">{data.profitMargin}% margin</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>P&L Visualization</CardTitle>
            <CardDescription>Revenue vs costs comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Revenue", amount: data?.revenue || 0, fill: "hsl(var(--chart-2))" },
                    { name: "COGS", amount: data?.cogs || 0, fill: "hsl(var(--destructive))" },
                    { name: "Gross Profit", amount: data?.grossProfit || 0, fill: "hsl(var(--primary))" },
                    { name: "Expenses", amount: data?.totalExpenses || 0, fill: "hsl(var(--chart-4))" },
                    { name: "Net Profit", amount: data?.netProfit || 0, fill: "hsl(var(--chart-3))" },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatTZS(Number(v) || 0)} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Cell key={i} fill={["hsl(var(--chart-2))", "hsl(var(--destructive))", "hsl(var(--primary))", "hsl(var(--chart-4))", "hsl(var(--chart-3))"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
