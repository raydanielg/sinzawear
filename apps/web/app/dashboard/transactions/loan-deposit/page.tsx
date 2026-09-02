"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { PiggyBankIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Loan } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function LoanDepositPage() {
  const { branchParam } = useBranch()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({ borrowerName: "", lenderName: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/transactions/loan-deposit", branchParam)).catch(() => ({ success: false }))
        if (res.success) setLoans(res.data.loans || res.data.loanDeposits || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = loans.filter((l) => {
    const q = search.toLowerCase()
    return l.loanNumber?.toLowerCase().includes(q) || l.borrowerName?.toLowerCase().includes(q)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.borrowerName || !formData.amount) { toast.error("Borrower name and amount are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/loan-deposit", {
        borrowerName: formData.borrowerName, lenderName: formData.lenderName || undefined,
        amount: Number(formData.amount), date: formData.date, notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Loan deposit recorded!")
        const refresh = await api.get(withBranch("/transactions/loan-deposit", branchParam))
        if (refresh.success) setLoans(refresh.data.loans || refresh.data.loanDeposits || [])
        setSheetOpen(false)
        setFormData({ borrowerName: "", lenderName: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" })
      } else toast.error(res.message || "Failed to record deposit")
    } catch { toast.error("Failed to record deposit") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Loan Deposits Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Loan #", "Borrower", "Principal", "Balance", "Start Date", "Status"]],
      body: filtered.map((l) => [l.loanNumber || "—", l.borrowerName, formatTZS(l.principalAmount), formatTZS(l.balance), formatDate(l.startDate), l.status]),
      theme: "striped", headStyles: { fillColor: [147, 51, 234], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.reduce((sum, l) => sum + l.principalAmount, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Loan Deposit" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Loan Deposits</h1><p className="text-sm text-muted-foreground">Record loan deposits received from lenders</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Deposit</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Deposits</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Amount</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Loan Deposits</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={PiggyBankIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No loan deposits found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Loan #</TableHead><TableHead>Borrower</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((l) => (<TableRow key={l.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{l.loanNumber || "—"}</TableCell><TableCell className="font-medium">{l.borrowerName}</TableCell><TableCell className="text-right">{formatTZS(l.principalAmount)}</TableCell><TableCell className="text-right font-bold text-amber-600">{formatTZS(l.balance)}</TableCell><TableCell className="text-muted-foreground">{formatDate(l.startDate)}</TableCell><TableCell><Badge variant="default" className="capitalize">{l.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Loan Deposit</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Borrower Name *</Label><Input value={formData.borrowerName} onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })} placeholder="Business / borrower name" required /></div>
            <div className="space-y-2"><Label>Lender / Source</Label><Input value={formData.lenderName} onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })} placeholder="Lender name (optional)" /></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Record Deposit"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Loan_Deposits_${new Date().toISOString().split("T")[0]}.pdf`} title="Loan Deposits Report" />
    </DashboardLayout>
  )
}
