"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileAddIcon, File02Icon, Search01Icon, EyeIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  totalAfterDiscount: number
  paidAmount: number
  balance: number
  status: string
  invoiceDate: string
  dueDate: string | null
  createdAt: string
  customer?: { name: string; phone?: string }
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  partial: "secondary",
  unpaid: "secondary",
  overdue: "destructive",
  draft: "secondary",
  cancelled: "destructive",
}

export default function InvoicesPage() {
  const { branchParam } = useBranch()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await api.get(withBranch("/invoices", branchParam))
        if (res.success) setInvoices(res.data.invoices || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [branchParam])

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase()
    return inv.invoiceNumber?.toLowerCase().includes(q) || inv.customer?.name?.toLowerCase().includes(q)
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Invoices" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage customer invoices and track payments</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="gap-2">
            <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} className="size-4" /> New Invoice
          </Button>
        </Link>
      </div>

      <div className="relative w-full sm:w-64">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search invoices..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <HugeiconsIcon icon={File02Icon} strokeWidth={2} className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customer?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(inv.invoiceDate || inv.createdAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatTZS(inv.total)}</TableCell>
                    <TableCell className="text-right">{formatTZS(inv.balance)}</TableCell>
                    <TableCell><Badge variant={statusVariant[inv.status] || "secondary"} className="capitalize">{inv.status}</Badge></TableCell>
                    <TableCell>
                      <Link href={`/dashboard/invoices/${inv.id}`}>
                        <Button variant="ghost" size="icon"><HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" /></Button>
                      </Link>
                    </TableCell>
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
