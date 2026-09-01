"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, FileLockIcon } from "@hugeicons/core-free-icons"
import { api, formatDateTime } from "@/lib/api"

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  description: string
  ipAddress: string
  userAgent: string
  createdAt: string
  user?: { name: string; email: string }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get("/audit-logs")
        if (res.success) setLogs(res.data.logs || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    return l.action?.toLowerCase().includes(q) || l.entity?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.user?.name?.toLowerCase().includes(q)
  })

  function actionBadge(action: string) {
    const variant = action === "create" ? "default" : action === "update" ? "secondary" : action === "delete" ? "destructive" : "secondary"
    return <Badge variant={variant} className="capitalize">{action}</Badge>
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Audit Logs" },
    ]}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track all system activities and changes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>{loading ? "Loading..." : `${filtered.length} entries`}</CardDescription>
            </div>
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-48 pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={FileLockIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No audit logs found</p>
                <p className="text-sm text-muted-foreground">System activities will be recorded here</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{actionBadge(log.action)}</TableCell>
                    <TableCell className="font-medium capitalize">{log.entity}</TableCell>
                    <TableCell className="text-muted-foreground">{log.description || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{log.user?.name || "System"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
