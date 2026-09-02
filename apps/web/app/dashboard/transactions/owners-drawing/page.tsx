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
import { UserRemoveIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { OwnersDrawing } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function OwnersDrawingPage() {
  const { branchParam } = useBranch()
  const [drawings, setDrawings] = useState<OwnersDrawing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({ ownerName: "", amount: "", date: new Date().toISOString().split("T")[0], account: "cash", reason: "", notes: "" })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/transactions/owners-drawing", branchParam)).catch(() => ({ success: false }))
        if (res.success) setDrawings(res.data.ownersDrawings || res.data.drawings || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = drawings.filter((d) => {
    const q = search.toLowerCase()
    return d.drawingNumber?.toLowerCase().includes(q) || d.ownerName?.toLowerCase().includes(q)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.ownerName || !formData.amount) { toast.error("Owner name and amount are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/owners-drawing", {
        ownerName: formData.ownerName, amount: Number(formData.amount), date: formData.date, account: formData.account, reason: formData.reason || undefined, notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Owners drawing recorded!")
        const refresh = await api.get(withBranch("/transactions/owners-drawing", branchParam))
        if (refresh.success) setDrawings(refresh.data.ownersDrawings || refresh.data.drawings || [])
        setSheetOpen(false)
        setFormData({ ownerName: "", amount: "", date: new Date().toISOString().split("T")[0], account: "cash", reason: "", notes: "" })
      } else toast.error(res.message || "Failed to record drawing")
    } catch { toast.error("Failed to record drawing") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Owners Drawings Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Drawing #", "Owner", "Amount", "Account", "Reason", "Date", "Status"]],
      body: filtered.map((d) => [d.drawingNumber || "—", d.ownerName, formatTZS(d.amount), d.account, d.reason?.slice(0, 20) || "—", formatDate(d.date), d.status]),
      theme: "striped", headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.reduce((sum, d) => sum + d.amount, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Owners Drawing" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Owners Drawings</h1><p className="text-sm text-muted-foreground">Record owner withdrawals and drawings</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Drawing</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Drawings</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Amount</span><p className="text-2xl font-bold text-destructive">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Owners Drawings</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={UserRemoveIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No owners drawings found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Drawing #</TableHead><TableHead>Owner</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((d) => (<TableRow key={d.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{d.drawingNumber || "—"}</TableCell><TableCell className="font-medium">{d.ownerName}</TableCell><TableCell className="text-right font-bold text-destructive">{formatTZS(d.amount)}</TableCell><TableCell className="text-muted-foreground text-xs">{d.reason || "—"}</TableCell><TableCell className="text-muted-foreground">{formatDate(d.date)}</TableCell><TableCell><Badge variant="default" className="capitalize">{d.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Owners Drawing</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Owner Name *</Label><Input value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} placeholder="Owner / Partner name" required /></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Account</Label><Select value={formData.account} onValueChange={(v) => setFormData({ ...formData, account: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_main">Main Bank</SelectItem><SelectItem value="bank_savings">Savings</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for drawing" /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Record Drawing"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Owners_Drawings_${new Date().toISOString().split("T")[0]}.pdf`} title="Owners Drawings Report" />
    </DashboardLayout>
  )
}
