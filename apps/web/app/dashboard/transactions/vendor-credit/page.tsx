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
import type { VendorCredit, Supplier } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function VendorCreditPage() {
  const { branchParam } = useBranch()
  const [credits, setCredits] = useState<VendorCredit[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({ supplierId: "", amount: "", reason: "" })

  useEffect(() => {
    async function fetchData() {
      try {
        const [creditRes, supRes] = await Promise.all([
          api.get(withBranch("/transactions/vendor-credit", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/purchases/suppliers", branchParam)).catch(() => ({ success: false })),
        ])
        if (creditRes.success) setCredits(creditRes.data.vendorCredits || creditRes.data.credits || [])
        if (supRes.success) setSuppliers(supRes.data.suppliers || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = credits.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = c.creditNumber?.toLowerCase().includes(q) || c.supplier?.name?.toLowerCase().includes(q) || c.reason?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.supplierId || !formData.amount || !formData.reason) { toast.error("Supplier, amount and reason are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/vendor-credit", {
        supplierId: formData.supplierId, amount: Number(formData.amount), reason: formData.reason,
      })
      if (res.success) {
        toast.success("Vendor credit created!")
        const refresh = await api.get(withBranch("/transactions/vendor-credit", branchParam))
        if (refresh.success) setCredits(refresh.data.vendorCredits || refresh.data.credits || [])
        setSheetOpen(false)
        setFormData({ supplierId: "", amount: "", reason: "" })
      } else toast.error(res.message || "Failed to create vendor credit")
    } catch { toast.error("Failed to create vendor credit") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Vendor Credits Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Credit #", "Supplier", "Amount", "Applied", "Balance", "Reason", "Status"]],
      body: filtered.map((c) => [c.creditNumber || "—", c.supplier?.name || "—", formatTZS(c.amount), formatTZS(c.appliedAmount), formatTZS(c.balance), c.reason?.slice(0, 25) || "—", c.status]),
      theme: "striped", headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalBalance = filtered.reduce((sum, c) => sum + c.balance, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Vendor Credit" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Vendor Credits</h1><p className="text-sm text-muted-foreground">Manage vendor credit notes</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Vendor Credit</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Credits</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Outstanding Balance</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : formatTZS(totalBalance)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Open</span><p className="text-2xl font-bold">{loading ? "—" : filtered.filter(c => c.status === "open").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Vendor Credits</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="applied">Applied</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No vendor credits found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Credit #</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((c) => (<TableRow key={c.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{c.creditNumber || "—"}</TableCell><TableCell className="font-medium">{c.supplier?.name || "—"}</TableCell><TableCell className="text-right">{formatTZS(c.amount)}</TableCell><TableCell className="text-right font-bold text-amber-600">{formatTZS(c.balance)}</TableCell><TableCell className="text-muted-foreground text-xs">{c.reason}</TableCell><TableCell><Badge variant={c.status === "closed" ? "default" : "secondary"} className="capitalize">{c.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Vendor Credit</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Supplier *</Label><Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })} items={Object.fromEntries(suppliers.map((s) => [s.id, s.name]))}><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Reason *</Label><Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for vendor credit" required /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Vendor Credit"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Vendor_Credits_${new Date().toISOString().split("T")[0]}.pdf`} title="Vendor Credits Report" />
    </DashboardLayout>
  )
}
