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
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ShoppingBag01Icon, Search01Icon, PlusIcon, EyeIcon, PrinterIcon, DownloadIcon, ReturnRequestIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime, withBranch } from "@/lib/api"
import type { Sale } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useBranch } from "@/lib/branch-context"

export default function SalesPage() {
  const { branchParam } = useBranch()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchSales() {
      try {
        const res = await api.get(withBranch("/sales", branchParam))
        if (res.success) setSales(res.data.sales || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [branchParam])

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase()
    return s.saleNumber?.toLowerCase().includes(q) || s.customer?.name?.toLowerCase().includes(q)
  })

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)

  function statusBadge(status: string) {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default", completed: "default", pending: "secondary", cancelled: "destructive", refunded: "destructive",
    }
    return <Badge variant={map[status] || "secondary"} className="capitalize">{status}</Badge>
  }

  function printReceipt(sale: Sale) {
    const w = window.open("", "_blank", "width=400,height=600")
    if (!w) { toast.error("Pop-up blocked. Allow pop-ups to print receipts."); return }
    w.document.write(`
      <html><head><title>Receipt ${sale.saleNumber}</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 320px; margin: 0 auto; }
        h2 { text-align: center; margin: 0; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        hr { border: 1px dashed #ccc; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; }
      </style></head><body>
        <h2>Sinza Classic Wear</h2>
        <p class="center">Receipt #${sale.saleNumber}</p>
        <p class="center">${formatDateTime(sale.createdAt)}</p>
        <p>Cashier: ${sale.cashier?.name || "—"}</p>
        <p>Customer: ${sale.customer?.name || "Walk-in"}</p>
        <hr>
        <table>
          ${(sale.items || []).map((item) => `
            <tr><td>${item.quantity}x ${item.variant?.product?.name || ""} ${item.variant?.color?.name || ""} ${item.variant?.size?.name || ""}</td><td class="right">${formatTZS(item.total)}</td></tr>
          `).join("")}
        </table>
        <hr>
        <table>
          <tr><td>Subtotal</td><td class="right">${formatTZS(sale.subtotal)}</td></tr>
          <tr><td>Discount</td><td class="right">${formatTZS(sale.discount)}</td></tr>
          <tr class="bold"><td>TOTAL</td><td class="right">${formatTZS(sale.total)}</td></tr>
        </table>
        <hr>
        <p>Payment: ${(sale.payments || []).map((p) => `${p.method} - ${formatTZS(p.amount)}`).join(", ")}</p>
        <hr>
        <p class="center">Thank you for shopping with us!</p>
      </body></html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  function downloadReceiptPDF(sale: Sale) {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text(`Receipt #${sale.saleNumber}`, pw / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Date: ${formatDateTime(sale.createdAt)}`, pw / 2, 35, { align: "center" })
    doc.text(`Cashier: ${sale.cashier?.name || "—"}  |  Customer: ${sale.customer?.name || "Walk-in"}`, pw / 2, 41, { align: "center" })
    autoTable(doc, {
      startY: 50,
      head: [["Item", "Qty", "Price", "Total"]],
      body: (sale.items || []).map((item) => [
        `${item.variant?.product?.name || ""} ${item.variant?.color?.name || ""} ${item.variant?.size?.name || ""}`.trim(),
        String(item.quantity), formatTZS(item.unitPrice), formatTZS(item.total),
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 15, right: 15 },
    })
    const finalY = (doc as any).lastAutoTable.finalY + 10
    autoTable(doc, {
      startY: finalY,
      body: [
        ["Subtotal", formatTZS(sale.subtotal)],
        ["Discount", formatTZS(sale.discount)],
        ["TOTAL", formatTZS(sale.total)],
      ],
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 120 }, 1: { halign: "right", fontStyle: "bold" } },
      margin: { left: 15, right: 15 },
    })
    doc.save(`Receipt_${sale.saleNumber}.pdf`)
  }

  async function handleReturn(sale: Sale) {
    if (!confirm(`Process return for receipt ${sale.saleNumber}? This will reverse the sale.`)) return
    try {
      const res = await api.post(`/sales/${sale.id}/return`, {})
      if (res.success) {
        toast.success("Return processed successfully")
        const refresh = await api.get("/sales")
        if (refresh.success) setSales(refresh.data.sales || [])
      } else {
        toast.error(res.message || "Failed to process return")
      }
    } catch {
      toast.error("Failed to process return")
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sales", href: "/dashboard/sales" }, { label: "All Sales" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">All completed sales transactions</p>
        </div>
        <Link href="/dashboard/pos"><Button><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Sale</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-2xl font-bold">{loading ? "—" : formatTZS(totalRevenue)}</span>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="text-2xl font-bold">{loading ? "—" : sales.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Average Sale</span>
              <span className="text-2xl font-bold">{loading ? "—" : formatTZS(sales.length ? totalRevenue / sales.length : 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Sales</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </div>
            <div className="relative w-full sm:w-48">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search receipt..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full pl-8" />
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
              <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No sales found</p>
                <p className="text-sm text-muted-foreground">Try changing your filters or complete a sale from the POS</p>
              </div>
              <Link href="/dashboard/pos"><Button size="sm"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Sale</Button></Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-medium">{sale.saleNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.customer?.name || "Walk-in"}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.branch?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{formatTZS(sale.total)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(sale.payments || []).map((p) => (
                          <Badge key={p.id} variant="outline" className="text-xs capitalize">{p.method}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(sale.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(sale.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/sales/${sale.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View Details"><HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" /></Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Print Receipt" onClick={() => printReceipt(sale)}><HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Download PDF" onClick={() => downloadReceiptPDF(sale)}><HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="size-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Process Return" onClick={() => handleReturn(sale)}><HugeiconsIcon icon={ReturnRequestIcon} strokeWidth={2} className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
