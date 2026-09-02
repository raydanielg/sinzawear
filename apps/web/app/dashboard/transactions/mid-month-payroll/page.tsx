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
import { CalendarAddIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Employee, Payroll } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function MidMonthPayrollPage() {
  const { branchParam } = useBranch()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: "", amount: "", month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()), notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [payRes, empRes] = await Promise.all([
          api.get(withBranch("/transactions/mid-month-payroll", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
        ])
        if (payRes.success) setPayrolls(payRes.data.midMonthPayrolls || payRes.data.payrolls || [])
        if (empRes.success) setEmployees(empRes.data.employees || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = payrolls.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = p.payrollNumber?.toLowerCase().includes(q) || p.employee?.fullName?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.employeeId || !formData.amount) { toast.error("Employee and amount are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/mid-month-payroll", {
        employeeId: formData.employeeId,
        amount: Number(formData.amount),
        month: Number(formData.month),
        year: Number(formData.year),
        notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Mid-month payroll created!")
        const refresh = await api.get(withBranch("/transactions/mid-month-payroll", branchParam))
        if (refresh.success) setPayrolls(refresh.data.midMonthPayrolls || refresh.data.payrolls || [])
        setSheetOpen(false)
        setFormData({ employeeId: "", amount: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), notes: "" })
      } else toast.error(res.message || "Failed to create mid-month payroll")
    } catch { toast.error("Failed to create mid-month payroll") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Mid-Month Payroll Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Payroll #", "Employee", "Amount", "Month/Year", "Payment Date", "Status"]],
      body: filtered.map((p) => [p.payrollNumber || "—", p.employee?.fullName || "—", formatTZS(p.netPay), `${p.month}/${p.year}`, p.paymentDate ? formatDate(p.paymentDate) : "—", p.status]),
      theme: "striped", headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.reduce((sum, p) => sum + p.netPay, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Mid Month Payroll" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Mid-Month Payroll</h1><p className="text-sm text-muted-foreground">Process mid-month salary advances and partial payments</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Mid-Month Payroll</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Records</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Amount</span><p className="text-2xl font-bold">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Paid</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : filtered.filter(p => p.status === "paid").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Mid-Month Payrolls</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={CalendarAddIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No mid-month payrolls found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Payroll #</TableHead><TableHead>Employee</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Month/Year</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((p) => (<TableRow key={p.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{p.payrollNumber || "—"}</TableCell><TableCell className="font-medium">{p.employee?.fullName || "—"}</TableCell><TableCell className="text-right font-bold">{formatTZS(p.netPay)}</TableCell><TableCell className="text-muted-foreground">{p.month}/{p.year}</TableCell><TableCell><Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Mid-Month Payroll</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Employee *</Label><Select value={formData.employeeId} onValueChange={(v) => setFormData({ ...formData, employeeId: v })} items={Object.fromEntries(employees.map((e) => [e.id, e.fullName || `${e.firstName} ${e.lastName}`]))}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName || `${e.firstName} ${e.lastName}`}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Month</Label><Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["1","2","3","4","5","6","7","8","9","10","11","12"].map(m => <SelectItem key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1]}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Year</Label><Input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Mid-Month Payroll"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Mid_Month_Payroll_${new Date().toISOString().split("T")[0]}.pdf`} title="Mid-Month Payroll Report" />
    </DashboardLayout>
  )
}
