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
import { BanknoteIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { EmployeeLoan, Employee } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function EmployeeLoanPage() {
  const { branchParam } = useBranch()
  const [loans, setLoans] = useState<EmployeeLoan[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: "", principalAmount: "", interestRate: "0",
    installments: "12", startDate: new Date().toISOString().split("T")[0], notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [loanRes, empRes] = await Promise.all([
          api.get(withBranch("/transactions/employee-loan", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
        ])
        if (loanRes.success) setLoans(loanRes.data.employeeLoans || loanRes.data.loans || [])
        if (empRes.success) setEmployees(empRes.data.employees || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = loans.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = l.loanNumber?.toLowerCase().includes(q) || l.employee?.fullName?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const principal = Number(formData.principalAmount) || 0
  const rate = Number(formData.interestRate) || 0
  const installments = Number(formData.installments) || 1
  const totalRepayable = principal + (principal * rate / 100)
  const installmentAmount = installments > 0 ? totalRepayable / installments : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.employeeId || !formData.principalAmount) { toast.error("Employee and principal amount are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/employee-loan", {
        employeeId: formData.employeeId,
        principalAmount: Number(formData.principalAmount),
        interestRate: Number(formData.interestRate) || 0,
        installments: Number(formData.installments),
        installmentAmount: Math.round(installmentAmount),
        startDate: formData.startDate,
        notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Employee loan created!")
        const refresh = await api.get(withBranch("/transactions/employee-loan", branchParam))
        if (refresh.success) setLoans(refresh.data.employeeLoans || refresh.data.loans || [])
        setSheetOpen(false)
        setFormData({ employeeId: "", principalAmount: "", interestRate: "0", installments: "12", startDate: new Date().toISOString().split("T")[0], notes: "" })
      } else toast.error(res.message || "Failed to create loan")
    } catch { toast.error("Failed to create loan") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Employee Loans Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Loan #", "Employee", "Principal", "Total Repayable", "Paid", "Balance", "Installments", "Status"]],
      body: filtered.map((l) => [l.loanNumber || "—", l.employee?.fullName || "—", formatTZS(l.principalAmount), formatTZS(l.totalRepayable), formatTZS(l.paidAmount), formatTZS(l.balance), `${l.paidInstallments}/${l.installments}`, l.status]),
      theme: "striped", headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalBalance = filtered.reduce((sum, l) => sum + l.balance, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Employee Loan" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Employee Loans</h1><p className="text-sm text-muted-foreground">Track loans issued to employees</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Loan</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Loans</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Outstanding Balance</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : formatTZS(totalBalance)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Active</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : filtered.filter(l => l.status === "active").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Employee Loans</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="defaulted">Defaulted</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={BanknoteIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No employee loans found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Loan #</TableHead><TableHead>Employee</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Installments</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((l) => (<TableRow key={l.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{l.loanNumber || "—"}</TableCell><TableCell className="font-medium">{l.employee?.fullName || "—"}</TableCell><TableCell className="text-right">{formatTZS(l.principalAmount)}</TableCell><TableCell className="text-right font-bold text-amber-600">{formatTZS(l.balance)}</TableCell><TableCell>{l.paidInstallments}/{l.installments}</TableCell><TableCell><Badge variant={l.status === "paid" ? "default" : l.status === "defaulted" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Employee Loan</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Employee *</Label><Select value={formData.employeeId} onValueChange={(v) => setFormData({ ...formData, employeeId: v })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName || `${e.firstName} ${e.lastName}`}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Principal Amount (TZS) *</Label><Input type="number" min="0" value={formData.principalAmount} onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" min="0" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Installments</Label><Input type="number" min="1" value={formData.installments} onChange={(e) => setFormData({ ...formData, installments: e.target.value })} /></div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Repayable:</span><span className="font-bold">{formatTZS(totalRepayable)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Per Installment:</span><span className="font-bold">{formatTZS(Math.round(installmentAmount))}</span></div>
            </div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Loan"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Employee_Loans_${new Date().toISOString().split("T")[0]}.pdf`} title="Employee Loans Report" />
    </DashboardLayout>
  )
}
