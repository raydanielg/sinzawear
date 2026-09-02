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
import { ArrowDataTransferHorizontalIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { FundTransfer } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function FundTransferPage() {
  const { branchParam } = useBranch()
  const [transfers, setTransfers] = useState<FundTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    fromAccount: "", toAccount: "", amount: "", fee: "0",
    date: new Date().toISOString().split("T")[0], reference: "", notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/transactions/fund-transfer", branchParam)).catch(() => ({ success: false }))
        if (res.success) setTransfers(res.data.fundTransfers || res.data.transfers || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = transfers.filter((t) => {
    const q = search.toLowerCase()
    const matchSearch = t.transferNumber?.toLowerCase().includes(q) || t.fromAccount?.toLowerCase().includes(q) || t.toAccount?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || t.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.fromAccount || !formData.toAccount || !formData.amount) { toast.error("From account, to account and amount are required"); return }
    if (formData.fromAccount === formData.toAccount) { toast.error("From and To accounts must be different"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/fund-transfer", {
        fromAccount: formData.fromAccount, toAccount: formData.toAccount,
        amount: Number(formData.amount), fee: Number(formData.fee) || 0,
        date: formData.date, reference: formData.reference || undefined, notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Fund transfer created!")
        const refresh = await api.get(withBranch("/transactions/fund-transfer", branchParam))
        if (refresh.success) setTransfers(refresh.data.fundTransfers || refresh.data.transfers || [])
        setSheetOpen(false)
        setFormData({ fromAccount: "", toAccount: "", amount: "", fee: "0", date: new Date().toISOString().split("T")[0], reference: "", notes: "" })
      } else toast.error(res.message || "Failed to create transfer")
    } catch { toast.error("Failed to create transfer") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Fund Transfers Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Transfer #", "From", "To", "Amount", "Fee", "Date", "Status"]],
      body: filtered.map((t) => [t.transferNumber || "—", t.fromAccount, t.toAccount, formatTZS(t.amount), formatTZS(t.fee), formatDate(t.date), t.status]),
      theme: "striped", headStyles: { fillColor: [147, 51, 234], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Fund Transfer" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Fund Transfers</h1><p className="text-sm text-muted-foreground">Transfer funds between accounts</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="w-full gap-2 sm:w-auto"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="w-full gap-2 sm:w-auto"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Transfer</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Transfers</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Amount</span><p className="text-2xl font-bold">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Completed</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : filtered.filter(t => t.status === "completed").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Fund Transfers</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No fund transfers found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Transfer #</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((t) => (<TableRow key={t.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{t.transferNumber || "—"}</TableCell><TableCell>{t.fromAccount}</TableCell><TableCell>{t.toAccount}</TableCell><TableCell className="text-right font-bold">{formatTZS(t.amount)}</TableCell><TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell><TableCell><Badge variant={t.status === "completed" ? "default" : t.status === "failed" ? "destructive" : "secondary"} className="capitalize">{t.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Fund Transfer</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>From Account *</Label><Select value={formData.fromAccount} onValueChange={(v) => setFormData({ ...formData, fromAccount: v })}><SelectTrigger><SelectValue placeholder="Select source account" /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_main">Main Bank Account</SelectItem><SelectItem value="bank_savings">Savings Account</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="petty_cash">Petty Cash</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>To Account *</Label><Select value={formData.toAccount} onValueChange={(v) => setFormData({ ...formData, toAccount: v })}><SelectTrigger><SelectValue placeholder="Select destination account" /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_main">Main Bank Account</SelectItem><SelectItem value="bank_savings">Savings Account</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="petty_cash">Petty Cash</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Fee (TZS)</Label><Input type="number" min="0" value={formData.fee} onChange={(e) => setFormData({ ...formData, fee: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Reference</Label><Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="Optional reference" /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Transfer"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Fund_Transfers_${new Date().toISOString().split("T")[0]}.pdf`} title="Fund Transfers Report" />
    </DashboardLayout>
  )
}
