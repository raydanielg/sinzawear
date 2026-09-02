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
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Wallet01Icon, Search01Icon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { PayrollLiability, Employee } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function PayrollLiabilitiesPage() {
  const { branchParam } = useBranch()
  const [liabilities, setLiabilities] = useState<PayrollLiability[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [liabRes, empRes] = await Promise.all([
          api.get(withBranch("/transactions/payroll-liability", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
        ])
        if (liabRes.success) setLiabilities(liabRes.data.payrollLiabilities || liabRes.data.liabilities || [])
        if (empRes.success) setEmployees(empRes.data.employees || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = liabilities.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = l.liabilityNumber?.toLowerCase().includes(q) || l.employee?.fullName?.toLowerCase().includes(q) || l.type?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || l.status === statusFilter
    return matchSearch && matchStatus
  })

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Payroll Liabilities Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Liability #", "Employee", "Type", "Amount", "Paid", "Balance", "Due Date", "Status"]],
      body: filtered.map((l) => [l.liabilityNumber || "—", l.employee?.fullName || "—", l.type, formatTZS(l.amount), formatTZS(l.paidAmount), formatTZS(l.balance), formatDate(l.dueDate), l.status]),
      theme: "striped", headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalBalance = filtered.reduce((sum, l) => sum + l.balance, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Payroll Liabilities" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Payroll Liabilities</h1><p className="text-sm text-muted-foreground">Track payroll taxes, deductions, and benefit liabilities</p></div>
        <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Liabilities</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Outstanding Balance</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : formatTZS(totalBalance)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Overdue</span><p className="text-2xl font-bold text-destructive">{loading ? "—" : filtered.filter(l => l.status === "overdue").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Liabilities</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No payroll liabilities found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Liability #</TableHead><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((l) => (<TableRow key={l.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{l.liabilityNumber || "—"}</TableCell><TableCell className="font-medium">{l.employee?.fullName || "—"}</TableCell><TableCell className="capitalize">{l.type}</TableCell><TableCell className="text-right">{formatTZS(l.amount)}</TableCell><TableCell className="text-right font-bold text-amber-600">{formatTZS(l.balance)}</TableCell><TableCell className="text-muted-foreground">{formatDate(l.dueDate)}</TableCell><TableCell><Badge variant={l.status === "paid" ? "default" : l.status === "overdue" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Payroll_Liabilities_${new Date().toISOString().split("T")[0]}.pdf`} title="Payroll Liabilities Report" />
    </DashboardLayout>
  )
}
