"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { File02Icon, FileAddIcon, Search01Icon, EyeIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"

interface Proforma {
  id: string
  proformaNumber: string
  total: number
  status: string
  validUntil: string
  createdAt: string
  customer?: { name: string }
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  accepted: "default",
  sent: "secondary",
  draft: "secondary",
  expired: "destructive",
  declined: "destructive",
  converted: "default",
}

export default function ProformaPage() {
  const { branchParam } = useBranch()
  const [proformas, setProformas] = useState<Proforma[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/proforma", branchParam))
        if (res.success) setProformas(res.data.proformas || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const filtered = proformas.filter((p) => {
    const q = search.toLowerCase()
    return p.proformaNumber?.toLowerCase().includes(q) || p.customer?.name?.toLowerCase().includes(q)
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Proforma" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proforma Invoices</h1>
          <p className="text-sm text-muted-foreground">Create and manage proforma documents</p>
        </div>
        <Link href="/dashboard/proforma/new">
          <Button className="gap-2">
            <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} className="size-4" /> New Proforma
          </Button>
        </Link>
      </div>

      <div className="relative w-full sm:w-64">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search proforma..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <HugeiconsIcon icon={File02Icon} strokeWidth={2} className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              No proforma found. Create your first proforma to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proforma #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.proformaNumber}</TableCell>
                    <TableCell>{p.customer?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.validUntil ? formatDate(p.validUntil) : "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatTZS(p.total)}</TableCell>
                    <TableCell><Badge variant={statusVariant[p.status] || "secondary"} className="capitalize">{p.status}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon"><HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" /></Button></TableCell>
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
