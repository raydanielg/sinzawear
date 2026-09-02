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
import { GiftIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { EmployeeAllowance, Employee } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function EmployeeAllowancePage() {
  const { branchParam } = useBranch()
  const [allowances, setAllowances] = useState<EmployeeAllowance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: "", type: "transport", amount: "", frequency: "monthly",
    effectiveDate: new Date().toISOString().split("T")[0], notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [allowRes, empRes] = await Promise.all([
          api.get(withBranch("/transactions/employee-allowance", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
        ])
        if (allowRes.success) setAllowances(allowRes.data.employeeAllowances || allowRes.data.allowances || [])
        if (empRes.success) setEmployees(empRes.data.employees || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = allowances.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = a.employee?.fullName?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.employeeId || !formData.amount) { toast.error("Employee and amount are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/employee-allowance", {
        employeeId: formData.employeeId, type: formData.type, amount: Number(formData.amount),
        frequency: formData.frequency, effectiveDate: formData.effectiveDate, notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Allowance created!")
        const refresh = await api.get(withBranch("/transactions/employee-allowance", branchParam))
        if (refresh.success) setAllowances(refresh.data.employeeAllowances || refresh.data.allowances || [])
        setSheetOpen(false)
        setFormData({ employeeId: "", type: "transport", amount: "", frequency: "monthly", effectiveDate: new Date().toISOString().split("T")[0], notes: "" })
      } else toast.error(res.message || "Failed to create allowance")
    } catch { toast.error("Failed to create allowance") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Employee Allowances Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Employee", "Type", "Amount", "Frequency", "Effective Date", "Status"]],
      body: filtered.map((a) => [a.employee?.fullName || "—", a.type, formatTZS(a.amount), a.frequency, formatDate(a.effectiveDate), a.status]),
      theme: "striped", headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.filter(a => a.status === "active").reduce((sum, a) => sum + a.amount, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Employee Allowance" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Employee Allowances</h1><p className="text-sm text-muted-foreground">Manage employee allowance records</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Allowance</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Allowances</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Active Total</span><p className="text-2xl font-bold">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Active Count</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : filtered.filter(a => a.status === "active").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Allowances</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="ended">Ended</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={GiftIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No allowances found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Frequency</TableHead><TableHead>Effective Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((a) => (<TableRow key={a.id} className="hover:bg-muted/50"><TableCell className="font-medium">{a.employee?.fullName || "—"}</TableCell><TableCell className="capitalize">{a.type}</TableCell><TableCell className="text-right font-bold">{formatTZS(a.amount)}</TableCell><TableCell className="capitalize">{a.frequency}</TableCell><TableCell className="text-muted-foreground">{formatDate(a.effectiveDate)}</TableCell><TableCell><Badge variant={a.status === "active" ? "default" : "secondary"} className="capitalize">{a.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Employee Allowance</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Employee *</Label><Select value={formData.employeeId} onValueChange={(v) => setFormData({ ...formData, employeeId: v })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName || `${e.firstName} ${e.lastName}`}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Allowance Type</Label><Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="transport">Transport</SelectItem><SelectItem value="housing">Housing</SelectItem><SelectItem value="meal">Meal</SelectItem><SelectItem value="medical">Medical</SelectItem><SelectItem value="education">Education</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Frequency</Label><Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem><SelectItem value="one_time">One Time</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Effective Date</Label><Input type="date" value={formData.effectiveDate} onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" /></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Allowance"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Employee_Allowances_${new Date().toISOString().split("T")[0]}.pdf`} title="Employee Allowances Report" />
    </DashboardLayout>
  )
}
