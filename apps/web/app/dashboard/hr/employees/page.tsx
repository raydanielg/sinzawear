"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { UserGroupIcon, UserAddIcon, Search01Icon, EyeIcon, Edit02Icon, TrashIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch, getBranches } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Employee, Department, Branch } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function EmployeesPage() {
  const { branchParam } = useBranch()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", gender: "male",
    dateOfBirth: "", departmentId: "", position: "", employmentType: "full_time",
    hireDate: new Date().toISOString().split("T")[0], salary: "", allowance: "0",
    status: "active", branchId: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, deptRes, branchList] = await Promise.all([
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
          api.get("/hr/departments").catch(() => ({ success: false })),
          getBranches().catch(() => []),
        ])
        if (empRes.success) setEmployees(empRes.data.employees || [])
        if (deptRes.success) setDepartments(deptRes.data.departments || [])
        setBranches(branchList)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = e.firstName?.toLowerCase().includes(q) || e.lastName?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.employeeNumber?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q)
    const matchDept = deptFilter === "all" || e.departmentId === deptFilter
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    return matchSearch && matchDept && matchStatus
  })

  function openAdd() {
    setEditing(null)
    setFormData({
      firstName: "", lastName: "", email: "", phone: "", address: "", gender: "male",
      dateOfBirth: "", departmentId: "", position: "", employmentType: "full_time",
      hireDate: new Date().toISOString().split("T")[0], salary: "", allowance: "0",
      status: "active", branchId: "",
    })
    setSheetOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setFormData({
      firstName: emp.firstName || "", lastName: emp.lastName || "", email: emp.email || "",
      phone: emp.phone || "", address: emp.address || "", gender: emp.gender || "male",
      dateOfBirth: emp.dateOfBirth?.split("T")[0] || "", departmentId: emp.departmentId || "",
      position: emp.position || "", employmentType: emp.employmentType || "full_time",
      hireDate: emp.hireDate?.split("T")[0] || "", salary: String(emp.salary || ""),
      allowance: String(emp.allowance || "0"), status: emp.status || "active",
      branchId: emp.branchId || "",
    })
    setSheetOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.position) {
      toast.error("First name, last name, email, and position are required")
      return
    }
    setSaving(true)
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        departmentId: formData.departmentId || undefined,
        position: formData.position,
        employmentType: formData.employmentType,
        hireDate: formData.hireDate,
        salary: Number(formData.salary) || 0,
        allowance: Number(formData.allowance) || 0,
        status: formData.status,
        branchId: formData.branchId || undefined,
      }
      const res = editing
        ? await api.put(`/hr/employees/${editing.id}`, payload)
        : await api.post("/hr/employees", payload)
      if (res.success) {
        toast.success(editing ? "Employee updated!" : "Employee added!")
        setSheetOpen(false)
        const refresh = await api.get(withBranch("/hr/employees", branchParam))
        if (refresh.success) setEmployees(refresh.data.employees || [])
      } else {
        toast.error(res.message || "Failed to save employee")
      }
    } catch {
      toast.error("Failed to save employee")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(`Delete employee ${emp.firstName} ${emp.lastName}? This cannot be undone.`)) return
    try {
      const res = await api.delete(`/hr/employees/${emp.id}`)
      if (res.success) {
        toast.success("Employee deleted")
        setEmployees((prev) => prev.filter((e) => e.id !== emp.id))
      } else {
        toast.error(res.message || "Failed to delete employee")
      }
    } catch {
      toast.error("Failed to delete employee")
    }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Employee Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    doc.text(`Total Employees: ${filtered.length}`, pw / 2, 41, { align: "center" })

    autoTable(doc, {
      startY: 50,
      head: [["Emp #", "Name", "Position", "Department", "Type", "Salary", "Status"]],
      body: filtered.map((e) => [
        e.employeeNumber || "—",
        `${e.firstName} ${e.lastName}`,
        e.position || "—",
        e.department?.name || "—",
        e.employmentType?.replace("_", " ") || "—",
        formatTZS(e.salary || 0),
        e.status || "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc)
    setPdfOpen(true)
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "HR", href: "/dashboard/hr" }, { label: "Employees" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage your workforce and employee records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2">
            <HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export PDF
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <HugeiconsIcon icon={UserAddIcon} strokeWidth={2} className="size-4" /> Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Employees</CardTitle>
              <CardDescription>{filtered.length} of {employees.length} employees</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full sm:w-48">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search name, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-28"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No employees found</p>
                <p className="text-sm text-muted-foreground">Add your first employee to get started</p>
              </div>
              <Button onClick={openAdd} size="sm" className="gap-2">
                <HugeiconsIcon icon={UserAddIcon} strokeWidth={2} className="size-4" /> Add Employee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{emp.employeeNumber || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.position || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{emp.department?.name || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{emp.employmentType?.replace("_", " ") || "—"}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatTZS(emp.salary || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={emp.status === "active" ? "default" : emp.status === "on_leave" ? "secondary" : "destructive"} className="capitalize">
                          {emp.status?.replace("_", " ") || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit" onClick={() => openEdit(emp)}>
                            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Delete" onClick={() => handleDelete(emp)}>
                            <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4" />
                          </Button>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Employee" : "Add Employee"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Position *</Label>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="e.g. Sales Associate" required />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })} items={Object.fromEntries(departments.map((d) => [d.id, d.name]))}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={(v) => setFormData({ ...formData, employmentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hire Date *</Label>
                <Input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Salary (TZS) *</Label>
                <Input type="number" min="0" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Allowance (TZS)</Label>
                <Input type="number" min="0" value={formData.allowance} onChange={(e) => setFormData({ ...formData, allowance: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })} items={Object.fromEntries(branches.map((b) => [b.id, b.name]))}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            </div>
            <SheetFooter className="border-t gap-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update Employee" : "Add Employee"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <PdfPreviewModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        doc={pdfDoc}
        filename={`Employee_Report_${new Date().toISOString().split("T")[0]}.pdf`}
        title="Employee Report"
      />
    </DashboardLayout>
  )
}
