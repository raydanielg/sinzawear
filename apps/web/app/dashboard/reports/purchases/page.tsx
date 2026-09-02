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
import { Download04Icon, CoinsIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useBranch } from "@/lib/branch-context"

export default function PurchaseReportPage() {
  const { branchParam } = useBranch()
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
        if (branchParam) params.set("branchId", branchParam)
        const res = await api.get(`/reports/purchases${params.toString() ? `?${params}` : ""}`)
        if (res.success) setData(res.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [fromDate, toDate, branchParam])

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Reports", href: "/dashboard/reports" },
      { label: "Purchase Report" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Report</h1>
          <p className="text-sm text-muted-foreground">Purchases by supplier, branch, and period</p>
        </div>
        <Button variant="outline" onClick={() => {
          if (!data) return
          const doc = new jsPDF()
          const pw = doc.internal.pageSize.getWidth()
          doc.setFontSize(20); doc.setFont("helvetica", "bold")
          doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
          doc.setFontSize(14); doc.setFont("helvetica", "normal")
          doc.text("Purchase Report", pw / 2, 28, { align: "center" })
          doc.setFontSize(10)
          doc.text(`Period: ${fromDate || "All time"} to ${toDate || "Today"}`, pw / 2, 35, { align: "center" })
          doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 41, { align: "center" })
          autoTable(doc, {
            startY: 50,
            head: [["Metric", "Value"]],
            body: [
              ["Total Purchases", formatTZS(data.totalPurchases || 0)],
              ["Total Orders", String(data.totalOrders || 0)],
              ["Outstanding Balance", formatTZS(data.outstandingBalance || 0)],
            ],
            theme: "striped",
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 15, right: 15 },
          })
          if (data.bySupplier?.length) {
            autoTable(doc, {
              startY: (doc as any).lastAutoTable.finalY + 10,
              head: [["Supplier", "Orders", "Total Amount", "Balance"]],
              body: data.bySupplier.map((s: any) => [s.name, String(s.count), formatTZS(s.total), formatTZS(s.balance || 0)]),
              theme: "striped",
              headStyles: { fillColor: [99, 102, 241] },
              margin: { left: 15, right: 15 },
            })
          }
          doc.save(`Purchase_Report_${new Date().toISOString().split("T")[0]}.pdf`)
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Total Purchases</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{formatTZS(data?.totalPurchases || 0)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Total Orders</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold">{data?.totalOrders || 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Outstanding Balance</span>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-2xl font-bold text-destructive">{formatTZS(data?.outstandingBalance || 0)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchases by Supplier</CardTitle>
          <CardDescription>Top suppliers by purchase volume</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.bySupplier?.length > 0 ? (
            <div className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.bySupplier.map((s: any) => ({ name: s.name, Total: s.total, Balance: s.balance || 0 }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v: any) => formatTZS(Number(v) || 0)} />
                    <Bar dataKey="Total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.bySupplier.map((s: any) => (
                      <TableRow key={s.supplierId}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.count}</TableCell>
                        <TableCell className="font-medium">{formatTZS(s.total)}</TableCell>
                        <TableCell className="text-destructive">{formatTZS(s.balance || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">No purchase data available</div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
