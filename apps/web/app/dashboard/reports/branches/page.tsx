"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, Store01Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function BranchReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/reports/branches")
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
      { label: "Branch Report" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch Report</h1>
          <p className="text-sm text-muted-foreground">Compare performance across all branches</p>
        </div>
        <Button variant="outline" onClick={() => {
          if (!data?.branches?.length) return
          const doc = new jsPDF()
          const pw = doc.internal.pageSize.getWidth()
          doc.setFontSize(20); doc.setFont("helvetica", "bold")
          doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
          doc.setFontSize(14); doc.setFont("helvetica", "normal")
          doc.text("Branch Performance Report", pw / 2, 28, { align: "center" })
          doc.setFontSize(10)
          doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
          autoTable(doc, {
            startY: 45,
            head: [["Branch", "Sales", "Transactions", "Profit", "Stock Value", "Expenses"]],
            body: data.branches.map((b: any) => [b.name, formatTZS(b.sales || 0), String(b.transactions || 0), formatTZS(b.profit || 0), formatTZS(b.stockValue || 0), formatTZS(b.expenses || 0)]),
            theme: "striped",
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 15, right: 15 },
          })
          doc.save(`Branch_Report_${new Date().toISOString().split("T")[0]}.pdf`)
        }}><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export PDF</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch Performance</CardTitle>
          <CardDescription>Sales, profit, and inventory by branch</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.branches?.length > 0 ? (
            <div className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.branches.map((b: any) => ({ name: b.name, Sales: b.sales || 0, Profit: b.profit || 0, Expenses: b.expenses || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatTZS(Number(v) || 0)} />
                    <Legend />
                    <Bar dataKey="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Profit" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Stock Value</TableHead>
                      <TableHead>Expenses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.branches.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="font-medium">{formatTZS(b.sales || 0)}</TableCell>
                        <TableCell>{b.transactions || 0}</TableCell>
                        <TableCell className="text-primary font-medium">{formatTZS(b.profit || 0)}</TableCell>
                        <TableCell>{formatTZS(b.stockValue || 0)}</TableCell>
                        <TableCell className="text-destructive">{formatTZS(b.expenses || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">No branch data available</div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
