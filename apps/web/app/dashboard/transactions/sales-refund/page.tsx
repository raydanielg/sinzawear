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
import { CancelCircleIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { SalesRefund, Customer } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function SalesRefundPage() {
  const { branchParam } = useBranch()
  const [refunds, setRefunds] = useState<SalesRefund[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({ customerId: "", amount: "", reason: "", refundMethod: "cash" })

  useEffect(() => {
    async function fetchData() {
      try {
        const [refundRes, custRes] = await Promise.all([
          api.get(withBranch("/transactions/sales-refund", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/customers", branchParam)).catch(() => ({ success: false })),
        ])
        if (refundRes.success) setRefunds(refundRes.data.salesRefunds || refundRes.data.refunds || [])
        if (custRes.success) setCustomers(custRes.data.customers || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = refunds.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = r.refundNumber?.toLowerCase().includes(q) || r.customer?.name?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customerId || !formData.amount || !formData.reason) { toast.error("Customer, amount and reason are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/sales-refund", {
        customerId: formData.customerId, amount: Number(formData.amount), reason: formData.reason, refundMethod: formData.refundMethod,
      })
      if (res.success) {
        toast.success("Sales refund created!")
        const refresh = await api.get(withBranch("/transactions/sales-refund", branchParam))
        if (refresh.success) setRefunds(refresh.data.salesRefunds || refresh.data.refunds || [])
        setSheetOpen(false)
        setFormData({ customerId: "", amount: "", reason: "", refundMethod: "cash" })
      } else toast.error(res.message || "Failed to create refund")
    } catch { toast.error("Failed to create refund") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Sales Refunds Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Refund #", "Customer", "Amount", "Method", "Reason", "Date", "Status"]],
      body: filtered.map((r) => [r.refundNumber || "—", r.customer?.name || "—", formatTZS(r.amount), r.refundMethod, r.reason?.slice(0, 25) || "—", formatDate(r.createdAt), r.status]),
      theme: "striped", headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Sales Refund" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Sales Refunds</h1><p className="text-sm text-muted-foreground">Process and track sales refunds</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Refund</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Refunds</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Amount</span><p className="text-2xl font-bold text-destructive">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Pending</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : filtered.filter(r => r.status === "pending").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Sales Refunds</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="processed">Processed</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No sales refunds found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Refund #</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Method</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((r) => (<TableRow key={r.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{r.refundNumber || "—"}</TableCell><TableCell className="font-medium">{r.customer?.name || "—"}</TableCell><TableCell className="text-right font-bold text-destructive">{formatTZS(r.amount)}</TableCell><TableCell className="capitalize">{r.refundMethod}</TableCell><TableCell className="text-muted-foreground text-xs">{r.reason}</TableCell><TableCell><Badge variant={r.status === "processed" ? "default" : r.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{r.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Sales Refund</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Customer *</Label><Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Refund Method</Label><Select value={formData.refundMethod} onValueChange={(v) => setFormData({ ...formData, refundMethod: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="store_credit">Store Credit</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Reason *</Label><Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for refund" required /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Refund"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Sales_Refunds_${new Date().toISOString().split("T")[0]}.pdf`} title="Sales Refunds Report" />
    </DashboardLayout>
  )
}
