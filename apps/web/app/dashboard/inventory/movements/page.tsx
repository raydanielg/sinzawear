"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowMoveDownLeftIcon } from "@hugeicons/core-free-icons"
import { api, formatDateTime } from "@/lib/api"
import type { StockMovement } from "@/lib/types"

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchMovements() {
      try {
        const res = await api.get("/inventory/movements")
        if (res.success) setMovements(res.data.movements || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchMovements()
  }, [])

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase()
    return m.variant?.product?.name?.toLowerCase().includes(q) || m.type?.toLowerCase().includes(q)
  })

  function typeBadge(type: string) {
    const colors: Record<string, "default" | "secondary" | "destructive"> = {
      purchase: "default", sale: "default", transfer_in: "default", transfer_out: "secondary",
      adjustment: "secondary", return_in: "default", return_out: "destructive", initial: "secondary",
    }
    return <Badge variant={colors[type] || "secondary"} className="capitalize">{type.replace(/_/g, " ")}</Badge>
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Inventory", href: "/dashboard/inventory" },
      { label: "Movements" },
    ]}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
        <p className="text-sm text-muted-foreground">Track all stock changes: purchases, sales, transfers, adjustments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Movements</CardTitle>
              <CardDescription>Complete stock movement history</CardDescription>
            </div>
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-48 pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={ArrowMoveDownLeftIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No stock movements recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty Change</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.variant?.product?.name || "—"}</TableCell>
                    <TableCell>{typeBadge(m.type)}</TableCell>
                    <TableCell className={m.quantity > 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.previousQuantity}</TableCell>
                    <TableCell className="font-medium">{m.newQuantity}</TableCell>
                    <TableCell className="text-muted-foreground">{m.branch?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.note || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(m.createdAt)}</TableCell>
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
