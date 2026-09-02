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
import { Calendar03Icon, Search01Icon, CheckmarkCircle02Icon, CancelCircleIcon, ClockIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatDateTime, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Employee, Attendance } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function AttendancePage() {
  const { branchParam } = useBranch()
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0])
  const [statusFilter, setStatusFilter] = useState("all")
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: "", date: new Date().toISOString().split("T")[0],
    checkIn: "08:00", checkOut: "17:00", status: "present", notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [attRes, empRes] = await Promise.all([
          api.get(withBranch("/hr/attendance", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
        ])
        if (attRes.success) setAttendance(attRes.data.attendance || [])
        if (empRes.success) setEmployees(empRes.data.employees || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const filtered = attendance.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = a.employee?.firstName?.toLowerCase().includes(q) || a.employee?.lastName?.toLowerCase().includes(q) || a.employee?.employeeNumber?.toLowerCase().includes(q)
    const matchDate = !dateFilter || a.date?.split("T")[0] === dateFilter
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchDate && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.employeeId) { toast.error("Select an employee"); return }
    setSaving(true)
    try {
      const res = await api.post("/hr/attendance", {
        employeeId: formData.employeeId,
        date: formData.date,
        checkIn: formData.checkIn || undefined,
        checkOut: formData.checkOut || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      })
      if (res.success) {
        toast.success("Attendance recorded!")
        const refresh = await api.get(withBranch("/hr/attendance", branchParam))
        if (refresh.success) setAttendance(refresh.data.attendance || [])
        setFormData({ ...formData, notes: "" })
      } else {
        toast.error(res.message || "Failed to record attendance")
      }
    } catch {
      toast.error("Failed to record attendance")
    } finally {
      setSaving(false)
    }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Attendance Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Date: ${dateFilter || "All"} | Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44,
      head: [["Emp #", "Name", "Date", "Check In", "Check Out", "Hours", "Status"]],
      body: filtered.map((a) => [
        a.employee?.employeeNumber || "—",
        a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : "—",
        a.date?.split("T")[0] || "—",
        a.checkIn?.split("T")[1]?.slice(0, 5) || "—",
        a.checkOut?.split("T")[1]?.slice(0, 5) || "—",
        String(a.workHours || "—"),
        a.status || "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc)
    setPdfOpen(true)
  }

  const presentCount = filtered.filter((a) => a.status === "present").length
  const absentCount = filtered.filter((a) => a.status === "absent").length
  const lateCount = filtered.filter((a) => a.status === "late").length

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "HR", href: "/dashboard/hr" }, { label: "Attendance" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Track employee attendance and work hours</p>
        </div>
        <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2">
          <HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export PDF
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Present</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : presentCount}</p></div>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-8 text-emerald-500/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Late</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : lateCount}</p></div>
            <HugeiconsIcon icon={ClockIcon} strokeWidth={2} className="size-8 text-amber-500/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Absent</span><p className="text-2xl font-bold text-destructive">{loading ? "—" : absentCount}</p></div>
            <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-8 text-destructive/50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>Record today's attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select value={formData.employeeId} onValueChange={(v) => setFormData({ ...formData, employeeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Check In</Label>
                  <Input type="time" value={formData.checkIn} onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Check Out</Label>
                  <Input type="time" value={formData.checkOut} onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" />
              </div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saving..." : "Record Attendance"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>{filtered.length} records</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 w-36" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
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
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/50">
                        <TableCell>
                          <p className="font-medium">{a.employee?.firstName} {a.employee?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{a.employee?.employeeNumber}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.date?.split("T")[0] || "—"}</TableCell>
                        <TableCell>{a.checkIn?.split("T")[1]?.slice(0, 5) || "—"}</TableCell>
                        <TableCell>{a.checkOut?.split("T")[1]?.slice(0, 5) || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{a.workHours ? `${a.workHours}h` : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"} className="capitalize">
                            {a.status?.replace("_", " ") || "—"}
                          </Badge>
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

      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Attendance_Report_${dateFilter}.pdf`} title="Attendance Report" />
    </DashboardLayout>
  )
}
