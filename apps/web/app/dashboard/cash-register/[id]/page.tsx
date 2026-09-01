"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Separator } from "@workspace/ui/components/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, CashierIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime } from "@/lib/api"
import type { CashSession } from "@/lib/types"

export default function CashSessionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<CashSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/cash-register/sessions/${params.id}`)
        if (res.success) setSession(res.data.session)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Cash Register", href: "/dashboard/cash-register" },
        { label: "Session Details" },
      ]}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Cash Register", href: "/dashboard/cash-register" },
        { label: "Session Details" },
      ]}>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Session not found</CardContent></Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Cash Register", href: "/dashboard/cash-register" },
      { label: "Session Details" },
    ]}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Session</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={session.status === "open" ? "default" : "secondary"} className="capitalize">{session.status}</Badge>
            <span className="text-sm text-muted-foreground">{formatDateTime(session.openedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Session Summary</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Opening Float</span>
                <span className="font-medium">{formatTZS(session.openingFloat)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cash Sales</span>
                <span className="font-medium">{formatTZS(session.cashSales || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cash Refunds</span>
                <span className="font-medium text-destructive">{formatTZS(session.cashRefunds || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cash Expenses</span>
                <span className="font-medium text-destructive">{formatTZS(session.cashExpenses || 0)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expected Cash</span>
                <span className="text-lg font-bold">{formatTZS(session.expectedCash || 0)}</span>
              </div>
              {session.closingCash !== null && session.closingCash !== undefined && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Closing Cash</span>
                    <span className="text-lg font-bold">{formatTZS(session.closingCash)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Difference</span>
                    <span className={`font-bold ${(session.difference || 0) < 0 ? "text-destructive" : "text-primary"}`}>
                      {formatTZS(session.difference || 0)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {session.transactions && session.transactions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.transactions.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell><Badge variant="outline" className="capitalize">{t.type}</Badge></TableCell>
                        <TableCell>{t.description || "—"}</TableCell>
                        <TableCell className="font-medium">{formatTZS(t.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Session Info</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch</span>
                <span>{session.branch?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opened By</span>
                <span>{session.openedBy?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opened At</span>
                <span>{formatDateTime(session.openedAt)}</span>
              </div>
              {session.closedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closed By</span>
                    <span>{session.closedBy?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closed At</span>
                    <span>{formatDateTime(session.closedAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
