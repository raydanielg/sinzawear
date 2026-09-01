"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Separator } from "@workspace/ui/components/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { PrinterIcon, DownloadIcon, ReturnRequestIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime } from "@/lib/api"
import type { Sale } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

export default function SaleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSale() {
      try {
        const res = await api.get(`/sales/${params.id}`)
        if (res.success) setSale(res.data.sale)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSale()
  }, [params.id])

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sales", href: "/dashboard/sales" },
      { label: "Sale Details" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
          </Button>
          <div>
            {loading ? <Skeleton className="h-8 w-40" /> : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">Sale #{sale?.saleNumber}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={sale?.status === "paid" || sale?.status === "completed" ? "default" : "secondary"} className="capitalize">{sale?.status}</Badge>
                  <span className="text-sm text-muted-foreground">{sale ? formatDateTime(sale.createdAt) : ""}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => {
              if (!sale) return
              const w = window.open("", "_blank", "width=400,height=600")
              if (!w) { toast.error("Pop-up blocked"); return }
              w.document.write(`
                <html><head><title>Receipt ${sale.saleNumber}</title>
                <style>body{font-family:monospace;font-size:12px;padding:16px;max-width:320px;margin:0 auto}h2{text-align:center}hr{border:1px dashed #ccc;margin:8px 0}table{width:100%}td{padding:2px 0}.right{text-align:right}.center{text-align:center}</style>
                </head><body>
                <h2>Sinza Classic Wear</h2><p class="center">Receipt #${sale.saleNumber}</p><p class="center">${formatDateTime(sale.createdAt)}</p><hr>
                <table>${(sale.items||[]).map(i=>`<tr><td>${i.quantity}x ${i.variant?.product?.name||""}</td><td class="right">${formatTZS(i.total)}</td></tr>`).join("")}</table><hr>
                <table><tr><td>Subtotal</td><td class="right">${formatTZS(sale.subtotal)}</td></tr><tr><td>Discount</td><td class="right">${formatTZS(sale.discount)}</td></tr><tr style="font-weight:bold"><td>TOTAL</td><td class="right">${formatTZS(sale.total)}</td></tr></table><hr>
                <p class="center">Thank you!</p></body></html>`)
              w.document.close(); w.focus(); setTimeout(()=>{w.print();w.close()},300)
            }}><HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" /> <span className="hidden sm:inline">Print</span></Button>
            <Button variant="outline" onClick={() => {
              if (!sale) return
              const doc = new jsPDF()
              const pw = doc.internal.pageSize.getWidth()
              doc.setFontSize(20); doc.setFont("helvetica","bold")
              doc.text("Sinza Classic Wear", pw/2, 20, { align: "center" })
              doc.setFontSize(14); doc.setFont("helvetica","normal")
              doc.text(`Receipt #${sale.saleNumber}`, pw/2, 28, { align: "center" })
              doc.setFontSize(10)
              doc.text(`Date: ${formatDateTime(sale.createdAt)}`, pw/2, 35, { align: "center" })
              autoTable(doc, {
                startY: 45,
                head: [["Item","Qty","Price","Total"]],
                body: (sale.items||[]).map(i=>[`${i.variant?.product?.name||""} ${i.variant?.color?.name||""} ${i.variant?.size?.name||""}`.trim(), String(i.quantity), formatTZS(i.unitPrice), formatTZS(i.total)]),
                theme: "striped", headStyles: { fillColor: [99,102,241] }, margin: { left: 15, right: 15 },
              })
              const fy = (doc as any).lastAutoTable.finalY + 10
              autoTable(doc, { startY: fy, body: [["Subtotal",formatTZS(sale.subtotal)],["Discount",formatTZS(sale.discount)],["TOTAL",formatTZS(sale.total)]], columnStyles: { 0: { fontStyle: "bold", cellWidth: 120 }, 1: { halign: "right", fontStyle: "bold" } }, margin: { left: 15, right: 15 } })
              doc.save(`Receipt_${sale.saleNumber}.pdf`)
            }}><HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="size-4" /> <span className="hidden sm:inline">PDF</span></Button>
            <Button variant="destructive" onClick={async () => {
              if (!sale) return
              if (!confirm(`Process return for receipt ${sale.saleNumber}?`)) return
              try {
                const res = await api.post(`/sales/${sale.id}/return`, {})
                if (res.success) { toast.success("Return processed"); router.push("/dashboard/sales") }
                else toast.error(res.message || "Failed")
              } catch { toast.error("Failed to process return") }
            }}><HugeiconsIcon icon={ReturnRequestIcon} strokeWidth={2} className="size-4" /> <span className="hidden sm:inline">Return</span></Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : sale ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.variant?.product?.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.variant?.color?.name} / {item.variant?.size?.name}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatTZS(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatTZS(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {sale.payments?.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <Badge variant="outline" className="capitalize">{p.method}</Badge>
                      <span className="font-medium">{formatTZS(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                {sale.customer ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{sale.customer.name}</span>
                    {sale.customer.phone && <span className="text-sm text-muted-foreground">{sale.customer.phone}</span>}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Walk-in customer</span>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatTZS(sale.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatTZS(sale.discount)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold">{formatTZS(sale.total)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-primary">{formatTZS(sale.payments?.reduce((s, p) => s + p.amount, 0) || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch</span>
                  <span>{sale.branch?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier</span>
                  <span>{sale.cashier?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDateTime(sale.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Sale not found</CardContent></Card>
      )}
    </DashboardLayout>
  )
}
