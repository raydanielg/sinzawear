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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch Report</h1>
          <p className="text-sm text-muted-foreground">Compare performance across all branches</p>
        </div>
        <Button variant="outline"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch Performance</CardTitle>
          <CardDescription>Sales, profit, and inventory by branch</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data?.branches?.length > 0 ? (
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
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">No branch data available</div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
