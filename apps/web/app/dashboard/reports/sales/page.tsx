"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function SalesReportPage() {
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
        const res = await api.get(`/reports/sales${params.toString() ? `?${params}` : ""}`)
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
      { label: "Sales Report" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
          <p className="text-sm text-muted-foreground">Sales by period, payment method, and cashier</p>
        </div>
        <Button variant="outline" onClick={() => {
          if (!data) return
          const doc = new jsPDF()
          const pw = doc.internal.pageSize.getWidth()
          doc.setFontSize(20); doc.setFont("helvetica", "bold")
          doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
          doc.setFontSize(14); doc.setFont("helvetica", "normal")
          doc.text("Sales Report", pw / 2, 28, { align: "center" })
          doc.setFontSize(10)
          doc.text(`Period: ${fromDate || "All time"} to ${toDate || "Today"}`, pw / 2, 35, { align: "center" })
          doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 41, { align: "center" })
          autoTable(doc, {
            startY: 50,
            head: [["Metric", "Value"]],
            body: [
              ["Total Sales", formatTZS(data.totalSales || 0)],
              ["Transactions", String(data.totalTransactions || 0)],
              ["Average Sale", formatTZS(data.averageSale || 0)],
              ["Returns", formatTZS(data.totalReturns || 0)],
            ],
            theme: "striped",
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 15, right: 15 },
          })
          if (data.byPaymentMethod?.length) {
            autoTable(doc, {
              startY: (doc as any).lastAutoTable.finalY + 10,
              head: [["Payment Method", "Transactions", "Total"]],
              body: data.byPaymentMethod.map((m: any) => [m.method.replace(/_/g, " "), String(m.count), formatTZS(m.total)]),
              theme: "striped",
              headStyles: { fillColor: [99, 102, 241] },
              margin: { left: 15, right: 15 },
            })
          }
          doc.save(`Sales_Report_${new Date().toISOString().split("T")[0]}.pdf`)
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Total Sales</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{formatTZS(data?.totalSales || 0)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Transactions</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{data?.totalTransactions || 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Avg Sale</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{formatTZS(data?.averageSale || 0)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Returns</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold text-destructive">{formatTZS(data?.totalReturns || 0)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales by Payment Method</CardTitle>
          <CardDescription>Breakdown by payment type</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.byPaymentMethod?.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byPaymentMethod.map((m: any) => ({ name: m.method.replace(/_/g, " "), total: m.total, count: m.count }))}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => formatTZS(Number(v) || 0)} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byPaymentMethod.map((m: any) => ({ name: m.method.replace(/_/g, " "), value: m.total }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--chart-2))" />
                      <Cell fill="hsl(var(--chart-3))" />
                      <Cell fill="hsl(var(--chart-4))" />
                    </Pie>
                    <Tooltip formatter={(v: any) => formatTZS(Number(v) || 0)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
