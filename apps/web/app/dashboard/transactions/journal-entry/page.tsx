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
import { Book01Icon, Search01Icon, PlusIcon, Download04Icon, TrashIcon } from "@hugeicons/core-free-icons"
import { api, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { JournalEntry } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

interface JournalLineInput { accountCode: string; accountName: string; debit: string; credit: string; description: string }

export default function JournalEntryPage() {
  const { branchParam } = useBranch()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({ date: new Date().toISOString().split("T")[0], description: "", reference: "" })
  const [lines, setLines] = useState<JournalLineInput[]>([{ accountCode: "", accountName: "", debit: "", credit: "", description: "" }, { accountCode: "", accountName: "", debit: "", credit: "", description: "" }])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/transactions/journal-entry", branchParam)).catch(() => ({ success: false }))
        if (res.success) setEntries(res.data.journalEntries || res.data.entries || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = e.entryNumber?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0)
  const isBalanced = totalDebit === totalCredit && totalDebit > 0

  function addLine() { setLines([...lines, { accountCode: "", accountName: "", debit: "", credit: "", description: "" }]) }
  function removeLine(idx: number) { setLines(lines.filter((_, i) => i !== idx)) }
  function updateLine(idx: number, field: keyof JournalLineInput, value: string) { setLines(lines.map((l, i) => i === idx ? { ...l, [field]: value } : l)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.description) { toast.error("Description is required"); return }
    if (!isBalanced) { toast.error("Debit and Credit must be balanced"); return }
    const validLines = lines.filter(l => l.accountCode || l.accountName || l.debit || l.credit)
    if (validLines.length < 2) { toast.error("At least 2 journal lines are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/journal-entry", {
        date: formData.date, description: formData.description, reference: formData.reference || undefined,
        lines: validLines.map(l => ({ accountCode: l.accountCode, accountName: l.accountName, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, description: l.description || undefined })),
      })
      if (res.success) {
        toast.success("Journal entry created!")
        const refresh = await api.get(withBranch("/transactions/journal-entry", branchParam))
        if (refresh.success) setEntries(refresh.data.journalEntries || refresh.data.entries || [])
        setSheetOpen(false)
        setFormData({ date: new Date().toISOString().split("T")[0], description: "", reference: "" })
        setLines([{ accountCode: "", accountName: "", debit: "", credit: "", description: "" }, { accountCode: "", accountName: "", debit: "", credit: "", description: "" }])
      } else toast.error(res.message || "Failed to create journal entry")
    } catch { toast.error("Failed to create journal entry") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Journal Entries Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Entry #", "Date", "Description", "Debit", "Credit", "Status"]],
      body: filtered.map((e) => [e.entryNumber || "—", formatDate(e.date), e.description?.slice(0, 30) || "—", e.totalDebit.toFixed(2), e.totalCredit.toFixed(2), e.status]),
      theme: "striped", headStyles: { fillColor: [147, 51, 234], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Journal Entry" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Journal Entries</h1><p className="text-sm text-muted-foreground">Create manual double-entry journal entries</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Journal Entry</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Entries</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Debit</span><p className="text-2xl font-bold">{loading ? "—" : filtered.reduce((s, e) => s + e.totalDebit, 0).toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Posted</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : filtered.filter(e => e.status === "posted").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Journal Entries</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="posted">Posted</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={Book01Icon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No journal entries found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Entry #</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((e) => (<TableRow key={e.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{e.entryNumber || "—"}</TableCell><TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell><TableCell>{e.description}</TableCell><TableCell className="text-right">{e.totalDebit.toFixed(0)}</TableCell><TableCell className="text-right">{e.totalCredit.toFixed(0)}</TableCell><TableCell><Badge variant={e.status === "posted" ? "default" : e.status === "reversed" ? "destructive" : "secondary"} className="capitalize">{e.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto"><SheetHeader><SheetTitle>New Journal Entry</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Reference</Label><Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="Optional reference" /></div>
            </div>
            <div className="space-y-2"><Label>Description *</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Journal entry description" required /></div>
            <div className="space-y-2">
              <Label>Journal Lines</Label>
              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center rounded-lg border p-2">
                    <Input className="col-span-3 h-8 text-xs" placeholder="Account Code" value={line.accountCode} onChange={(e) => updateLine(idx, "accountCode", e.target.value)} />
                    <Input className="col-span-3 h-8 text-xs" placeholder="Account Name" value={line.accountName} onChange={(e) => updateLine(idx, "accountName", e.target.value)} />
                    <Input className="col-span-2 h-8 text-xs" type="number" placeholder="Debit" value={line.debit} onChange={(e) => updateLine(idx, "debit", e.target.value)} />
                    <Input className="col-span-2 h-8 text-xs" type="number" placeholder="Credit" value={line.credit} onChange={(e) => updateLine(idx, "credit", e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeLine(idx)} disabled={lines.length <= 2}><HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-3.5" /></Button>
                    <Input className="col-span-11 h-8 text-xs" placeholder="Line description (optional)" value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)} />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="w-full gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Line</Button>
            </div>
            <div className={`rounded-lg p-3 text-sm ${isBalanced ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
              <div className="flex justify-between"><span>Total Debit:</span><span className="font-bold">{totalDebit.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Total Credit:</span><span className="font-bold">{totalCredit.toFixed(2)}</span></div>
              <div className="flex justify-between border-t mt-1 pt-1"><span>{isBalanced ? "Balanced ✓" : "Not balanced ✗"}</span><span className="font-bold">{(totalDebit - totalCredit).toFixed(2)}</span></div>
            </div>
            <SheetFooter><Button type="submit" disabled={saving || !isBalanced} className="w-full">{saving ? "Creating..." : "Create Journal Entry"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Journal_Entries_${new Date().toISOString().split("T")[0]}.pdf`} title="Journal Entries Report" />
    </DashboardLayout>
  )
}
