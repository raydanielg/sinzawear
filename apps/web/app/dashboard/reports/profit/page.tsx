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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profit & Loss Report</h1>
          <p className="text-sm text-muted-foreground">Revenue, COGS, expenses, and net profit</p>
        </div>
        <Button variant="outline"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1">
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-40" />
          </div>
        </CardContent>
      </Card>

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
    </DashboardLayout>
  )
}
