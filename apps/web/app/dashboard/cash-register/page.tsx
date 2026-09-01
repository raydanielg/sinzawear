"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CashierIcon, PlayIcon, StopIcon, EyeIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime } from "@/lib/api"
import type { CashSession, Branch } from "@/lib/types"

export default function CashRegisterPage() {
  const [sessions, setSessions] = useState<CashSession[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openAmount, setOpenAmount] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessRes, branchRes] = await Promise.all([
          api.get("/cash-register/sessions"),
          api.get("/branches"),
        ])
        if (sessRes.success) setSessions(sessRes.data.sessions || [])
        if (branchRes.success) setBranches(branchRes.data.branches || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeSession = sessions.find((s) => s.status === "open")
  const closedSessions = sessions.filter((s) => s.status === "closed")

  async function handleOpenSession(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post("/cash-register/sessions", {
        openingFloat: Number(openAmount) || 0,
      })
      if (res.success) {
        toast.success("Cash session opened!")
        setDialogOpen(false)
        setOpenAmount("")
        const refresh = await api.get("/cash-register/sessions")
        if (refresh.success) setSessions(refresh.data.sessions || [])
      } else {
        toast.error(res.message || "Failed to open session")
      }
    } catch {
      toast.error("Failed to open session")
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseSession() {
    setSaving(true)
    try {
      const res = await api.post(`/cash-register/sessions/${activeSession?.id}/close`, {})
      if (res.success) {
        toast.success("Cash session closed!")
        const refresh = await api.get("/cash-register/sessions")
        if (refresh.success) setSessions(refresh.data.sessions || [])
      } else {
        toast.error(res.message || "Failed to close session")
      }
    } catch {
      toast.error("Failed to close session")
    } finally {
      setSaving(false)
    }
  }

  function statusBadge(status: string) {
    return <Badge variant={status === "open" ? "default" : "secondary"} className="capitalize">{status}</Badge>
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Finance", href: "/dashboard/expenses" },
      { label: "Cash Register" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Register</h1>
          <p className="text-sm text-muted-foreground">Manage cash drawer sessions</p>
        </div>
        {activeSession ? (
          <Button variant="destructive" onClick={handleCloseSession} disabled={saving}>
            <HugeiconsIcon icon={StopIcon} strokeWidth={2} className="size-4" /> Close Session
          </Button>
        ) : (
          <Button onClick={() => setDialogOpen(true)}>
            <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-4" /> Open Session
          </Button>
        )}
      </div>

      {activeSession && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <HugeiconsIcon icon={CashierIcon} strokeWidth={2} className="size-6" />
              </div>
              <div>
                <p className="font-medium">Session Active</p>
                <p className="text-sm text-muted-foreground">Opened {formatDateTime(activeSession.openedAt)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground">Opening Float</p>
                <p className="text-lg font-bold">{formatTZS(activeSession.openingFloat)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground">Expected Cash</p>
                <p className="text-lg font-bold">{formatTZS(activeSession.expectedCash || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>All cash register sessions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={CashierIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No cash sessions yet</p>
                <p className="text-sm text-muted-foreground">Open a session to start tracking cash</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Opened By</TableHead>
                  <TableHead>Opening Float</TableHead>
                  <TableHead>Closed By</TableHead>
                  <TableHead>Closing Cash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">#{s.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.branch?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.openedBy?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{formatTZS(s.openingFloat)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.closedBy?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{s.closingCash ? formatTZS(s.closingCash) : "—"}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(s.openedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/cash-register/${s.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Open Cash Session</SheetTitle></SheetHeader>
          <form onSubmit={handleOpenSession} className="space-y-4">
            <div className="space-y-2">
              <Label>Opening Float (TZS)</Label>
              <Input type="number" min="0" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground">Count the cash in the drawer and enter the amount</p>
            </div>
            <SheetFooter className="mt-auto pt-4">
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Opening..." : "Open Session"}</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
