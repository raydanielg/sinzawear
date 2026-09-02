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
import { Wallet01Icon, Search01Icon, Download04Icon, EyeIcon, PlayCircleIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Employee, Payroll } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function PayrollPage() {
  const { branchParam } = useBranch()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfTitle, setPdfTitle] = useState("Payslip")
  const [pdfFilename, setPdfFilename] = useState("payslip.pdf")
  const now = new Date()
  const [formData, setFormData] = useState({
    employeeId: "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    basicSalary: "",
    allowances: "0",
    overtimePay: "0",
    deductions: "0",
    taxDeduction: "0",
    paymentMethod: "bank_transfer",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [payRes, empRes] = await Promise.all([
          api.get(withBranch("/hr/payroll", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
        ])
        if (payRes.success) setPayrolls(payRes.data.payrolls || [])
        if (empRes.success) setEmployees(empRes.data.employees || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const filtered = payrolls.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = p.employee?.firstName?.toLowerCase().includes(q) || p.employee?.lastName?.toLowerCase().includes(q) || p.payrollNumber?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalNetPay = filtered.reduce((sum, p) => sum + p.netPay, 0)
  const paidAmount = filtered.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.netPay, 0)
  const pendingAmount = filtered.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.netPay, 0)

  function onEmployeeSelect(empId: string) {
    const emp = employees.find((e) => e.id === empId)
    if (emp) {
      setFormData({ ...formData, employeeId: empId, basicSalary: String(emp.salary || 0), allowances: String(emp.allowance || 0) })
    } else {
      setFormData({ ...formData, employeeId: empId })
    }
  }

  const computedNetPay = (Number(formData.basicSalary) || 0) + (Number(formData.allowances) || 0) + (Number(formData.overtimePay) || 0) - (Number(formData.deductions) || 0) - (Number(formData.taxDeduction) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.employeeId || !formData.basicSalary) { toast.error("Employee and basic salary are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/hr/payroll", {
        employeeId: formData.employeeId,
        month: Number(formData.month),
        year: Number(formData.year),
        basicSalary: Number(formData.basicSalary),
        allowances: Number(formData.allowances) || 0,
        overtimePay: Number(formData.overtimePay) || 0,
        deductions: Number(formData.deductions) || 0,
        taxDeduction: Number(formData.taxDeduction) || 0,
        netPay: computedNetPay,
        paymentMethod: formData.paymentMethod,
      })
      if (res.success) {
        toast.success("Payroll created!")
        const refresh = await api.get(withBranch("/hr/payroll", branchParam))
        if (refresh.success) setPayrolls(refresh.data.payrolls || [])
      } else {
        toast.error(res.message || "Failed to create payroll")
      }
    } catch {
      toast.error("Failed to create payroll")
    } finally {
      setSaving(false)
    }
  }

  async function markPaid(payroll: Payroll) {
    try {
      const res = await api.put(`/hr/payroll/${payroll.id}/pay`, { paymentMethod: "bank_transfer" })
      if (res.success) {
        toast.success("Payroll marked as paid!")
        const refresh = await api.get(withBranch("/hr/payroll", branchParam))
        if (refresh.success) setPayrolls(refresh.data.payrolls || [])
      } else {
        toast.error(res.message || "Failed to mark as paid")
      }
    } catch {
      toast.error("Failed to mark as paid")
    }
  }

  function generatePayslip(payroll: Payroll) {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(22); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 22, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Payslip", pw / 2, 30, { align: "center" })
    doc.setFontSize(10)
    doc.text(`${MONTHS[payroll.month - 1] || ""} ${payroll.year}`, pw / 2, 37, { align: "center" })
    doc.text(`Payroll #: ${payroll.payrollNumber}`, pw / 2, 43, { align: "center" })

    autoTable(doc, {
      startY: 52,
      head: [["Employee Details", ""]],
      body: [
        ["Name", `${payroll.employee?.firstName || ""} ${payroll.employee?.lastName || ""}`],
        ["Employee #", payroll.employee?.employeeNumber || "—"],
        ["Position", payroll.employee?.position || "—"],
        ["Department", payroll.employee?.department?.name || "—"],
      ],
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 11 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
      margin: { left: 15, right: 15 },
    })

    const y1 = (doc as any).lastAutoTable.finalY + 10
    autoTable(doc, {
      startY: y1,
      head: [["Earnings", "Amount (TZS)"]],
      body: [
        ["Basic Salary", formatTZS(payroll.basicSalary)],
        ["Allowances", formatTZS(payroll.allowances)],
        ["Overtime Pay", formatTZS(payroll.overtimePay)],
      ],
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 11 },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 15, right: 15 },
    })

    const y2 = (doc as any).lastAutoTable.finalY + 10
    autoTable(doc, {
      startY: y2,
      head: [["Deductions", "Amount (TZS)"]],
      body: [
        ["Tax (PAYE)", formatTZS(payroll.taxDeduction)],
        ["Other Deductions", formatTZS(payroll.deductions)],
      ],
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 11 },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 15, right: 15 },
    })

    const y3 = (doc as any).lastAutoTable.finalY + 10
    autoTable(doc, {
      startY: y3,
      body: [["NET PAY", formatTZS(payroll.netPay)]],
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 120, fillColor: [99, 102, 241], textColor: 255, fontSize: 13 }, 1: { halign: "right", fontStyle: "bold", fillColor: [99, 102, 241], textColor: 255, fontSize: 13 } },
      margin: { left: 15, right: 15 },
    })

    const y4 = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(9); doc.setFont("helvetica", "italic")
    doc.text(`Status: ${payroll.status}`, 15, y4)
    if (payroll.paymentDate) doc.text(`Payment Date: ${formatDate(payroll.paymentDate)}`, 15, y4 + 5)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, y4 + 10)

    setPdfDoc(doc)
    setPdfTitle(`Payslip - ${payroll.employee?.firstName} ${payroll.employee?.lastName}`)
    setPdfFilename(`Payslip_${payroll.employee?.firstName}_${payroll.employee?.lastName}_${MONTHS[payroll.month - 1]}_${payroll.year}.pdf`)
    setPdfOpen(true)
  }

  function exportAllPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Payroll Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    doc.text(`Total Records: ${filtered.length} | Total Net Pay: ${formatTZS(totalNetPay)}`, pw / 2, 41, { align: "center" })

    autoTable(doc, {
      startY: 50,
      head: [["Payroll #", "Employee", "Month", "Basic", "Allowances", "Deductions", "Net Pay", "Status"]],
      body: filtered.map((p) => [
        p.payrollNumber || "—",
        p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : "—",
        `${MONTHS[p.month - 1] || ""} ${p.year}`,
        formatTZS(p.basicSalary),
        formatTZS(p.allowances),
        formatTZS(p.deductions + p.taxDeduction),
        formatTZS(p.netPay),
        p.status || "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc)
    setPdfTitle("Payroll Report")
    setPdfFilename(`Payroll_Report_${new Date().toISOString().split("T")[0]}.pdf`)
    setPdfOpen(true)
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "HR", href: "/dashboard/hr" }, { label: "Payroll" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground">Manage employee salaries and payslips</p>
        </div>
        <Button variant="outline" onClick={exportAllPDF} disabled={loading || filtered.length === 0} className="gap-2">
          <HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export All
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Total Net Pay</span><p className="text-2xl font-bold">{loading ? "—" : formatTZS(totalNetPay)}</p></div>
            <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-8 text-primary/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Paid</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : formatTZS(paidAmount)}</p></div>
            <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-8 text-emerald-500/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Pending</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : formatTZS(pendingAmount)}</p></div>
            <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-8 text-amber-500/50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create Payroll</CardTitle>
            <CardDescription>Generate payroll for an employee</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select value={formData.employeeId} onValueChange={onEmployeeSelect}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Basic Salary (TZS) *</Label>
                <Input type="number" min="0" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Allowances</Label>
                  <Input type="number" min="0" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Overtime Pay</Label>
                  <Input type="number" min="0" value={formData.overtimePay} onChange={(e) => setFormData({ ...formData, overtimePay: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tax (PAYE)</Label>
                  <Input type="number" min="0" value={formData.taxDeduction} onChange={(e) => setFormData({ ...formData, taxDeduction: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Other Deductions</Label>
                  <Input type="number" min="0" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Pay</span>
                  <span className="text-xl font-bold text-primary">{formatTZS(computedNetPay)}</span>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Payroll"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Payroll Records</CardTitle>
                <CardDescription>{filtered.length} records</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-40">
                  <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No payroll records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payroll #</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{p.payrollNumber || "—"}</TableCell>
                        <TableCell>
                          <p className="font-medium">{p.employee?.firstName} {p.employee?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{p.employee?.position}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{MONTHS[p.month - 1]} {p.year}</TableCell>
                        <TableCell className="text-right font-bold">{formatTZS(p.netPay)}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "paid" ? "default" : p.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View Payslip" onClick={() => generatePayslip(p)}>
                              <HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" />
                            </Button>
                            {p.status === "pending" && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" title="Mark Paid" onClick={() => markPaid(p)}>
                                <HugeiconsIcon icon={PlayCircleIcon} strokeWidth={2} className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={pdfFilename} title={pdfTitle} />
    </DashboardLayout>
  )
}
