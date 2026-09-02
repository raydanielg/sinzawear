"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileAddIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { SalesOrder, Customer } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function SalesOrderPage() {
  const { branchParam } = useBranch()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerId: "", orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "", notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [orderRes, custRes] = await Promise.all([
          api.get(withBranch("/transactions/sales-order", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/customers", branchParam)).catch(() => ({ success: false })),
        ])
        if (orderRes.success) setOrders(orderRes.data.salesOrders || orderRes.data.orders || [])
        if (custRes.success) setCustomers(custRes.data.customers || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchSearch = o.orderNumber?.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || o.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customerId) { toast.error("Customer is required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/sales-order", {
        customerId: formData.customerId,
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Sales order created!")
        const refresh = await api.get(withBranch("/transactions/sales-order", branchParam))
        if (refresh.success) setOrders(refresh.data.salesOrders || refresh.data.orders || [])
        setSheetOpen(false)
        setFormData({ customerId: "", orderDate: new Date().toISOString().split("T")[0], expectedDeliveryDate: "", notes: "" })
      } else toast.error(res.message || "Failed to create sales order")
    } catch { toast.error("Failed to create sales order") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Sales Orders Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Order #", "Customer", "Order Date", "Expected Delivery", "Total", "Status"]],
      body: filtered.map((o) => [o.orderNumber || "—", o.customer?.name || "—", formatDate(o.orderDate), o.expectedDeliveryDate ? formatDate(o.expectedDeliveryDate) : "—", formatTZS(o.totalAmount), o.status]),
      theme: "striped", headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.reduce((sum, o) => sum + o.totalAmount, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Sales Order" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Sales Orders</h1><p className="text-sm text-muted-foreground">Manage customer sales orders</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Sales Order</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Orders</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Value</span><p className="text-2xl font-bold">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Pending</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : filtered.filter(o => o.status === "pending").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Sales Orders</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="fulfilled">Fulfilled</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={FileAddIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No sales orders found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Order Date</TableHead><TableHead>Expected Delivery</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((o) => (<TableRow key={o.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{o.orderNumber || "—"}</TableCell><TableCell className="font-medium">{o.customer?.name || "—"}</TableCell><TableCell className="text-muted-foreground">{formatDate(o.orderDate)}</TableCell><TableCell className="text-muted-foreground">{o.expectedDeliveryDate ? formatDate(o.expectedDeliveryDate) : "—"}</TableCell><TableCell className="text-right font-bold">{formatTZS(o.totalAmount)}</TableCell><TableCell><Badge variant={o.status === "fulfilled" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">{o.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Sales Order</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Customer *</Label><Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Order Date</Label><Input type="date" value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Expected Delivery Date</Label><Input type="date" value={formData.expectedDeliveryDate} onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Sales Order"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Sales_Orders_${new Date().toISOString().split("T")[0]}.pdf`} title="Sales Orders Report" />
    </DashboardLayout>
  )
}
