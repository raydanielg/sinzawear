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
import { Wallet01Icon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { CreditSale, Customer } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function CreditSalePage() {
  const { branchParam } = useBranch()
  const [credits, setCredits] = useState<CreditSale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerId: "", amount: "", interestRate: "0",
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [creditRes, custRes] = await Promise.all([
          api.get(withBranch("/transactions/credit-sale", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/customers", branchParam)).catch(() => ({ success: false })),
        ])
        if (creditRes.success) setCredits(creditRes.data.creditSales || creditRes.data.credits || [])
        if (custRes.success) setCustomers(custRes.data.customers || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = credits.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = c.creditNumber?.toLowerCase().includes(q) || c.customer?.name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customerId || !formData.amount) { toast.error("Customer and amount are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/credit-sale", {
        customerId: formData.customerId,
        amount: Number(formData.amount),
        interestRate: Number(formData.interestRate) || 0,
        dueDate: formData.dueDate,
        notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Credit sale created!")
        const refresh = await api.get(withBranch("/transactions/credit-sale", branchParam))
        if (refresh.success) setCredits(refresh.data.creditSales || refresh.data.credits || [])
        setSheetOpen(false)
        setFormData({ customerId: "", amount: "", interestRate: "0", dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], notes: "" })
      } else toast.error(res.message || "Failed to create credit sale")
    } catch { toast.error("Failed to create credit sale") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Credit Sales Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Credit #", "Customer", "Amount", "Paid", "Balance", "Due Date", "Status"]],
      body: filtered.map((c) => [c.creditNumber || "—", c.customer?.name || "—", formatTZS(c.amount), formatTZS(c.paidAmount), formatTZS(c.balance), formatDate(c.dueDate), c.status]),
      theme: "striped", headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalBalance = filtered.reduce((sum, c) => sum + c.balance, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Credit Sale/Loan" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Credit Sales / Loans</h1><p className="text-sm text-muted-foreground">Manage credit sales and customer loans</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Credit Sale</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Credits</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Outstanding Balance</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : formatTZS(totalBalance)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Overdue</span><p className="text-2xl font-bold text-destructive">{loading ? "—" : filtered.filter(c => c.status === "overdue").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Credit Sales</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="defaulted">Defaulted</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No credit sales found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Credit #</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((c) => (<TableRow key={c.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{c.creditNumber || "—"}</TableCell><TableCell className="font-medium">{c.customer?.name || "—"}</TableCell><TableCell className="text-right">{formatTZS(c.amount)}</TableCell><TableCell className="text-right text-emerald-600">{formatTZS(c.paidAmount)}</TableCell><TableCell className="text-right font-bold text-amber-600">{formatTZS(c.balance)}</TableCell><TableCell className="text-muted-foreground">{formatDate(c.dueDate)}</TableCell><TableCell><Badge variant={c.status === "paid" ? "default" : c.status === "overdue" || c.status === "defaulted" ? "destructive" : "secondary"} className="capitalize">{c.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Credit Sale</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Customer *</Label><Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" min="0" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Credit Sale"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Credit_Sales_${new Date().toISOString().split("T")[0]}.pdf`} title="Credit Sales Report" />
    </DashboardLayout>
  )
}
