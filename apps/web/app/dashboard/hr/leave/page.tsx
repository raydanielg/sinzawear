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
import { CalendarRemove01Icon, Search01Icon, CheckmarkCircle02Icon, CancelCircleIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Employee, LeaveRequest } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function LeavePage() {
  const { branchParam } = useBranch()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "annual",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaveRes, empRes] = await Promise.all([
          api.get(withBranch("/hr/leave", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
        ])
        if (leaveRes.success) setLeaves(leaveRes.data.leaveRequests || [])
        if (empRes.success) setEmployees(empRes.data.employees || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const filtered = leaves.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = l.employee?.firstName?.toLowerCase().includes(q) || l.employee?.lastName?.toLowerCase().includes(q) || l.leaveNumber?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const pendingCount = leaves.filter((l) => l.status === "pending").length
  const approvedCount = leaves.filter((l) => l.status === "approved").length
  const rejectedCount = leaves.filter((l) => l.status === "rejected").length

  function calcDays(start: string, end: string): number {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.employeeId || !formData.reason) { toast.error("Employee and reason are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/hr/leave", {
        employeeId: formData.employeeId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: calcDays(formData.startDate, formData.endDate),
        reason: formData.reason,
      })
      if (res.success) {
        toast.success("Leave request submitted!")
        const refresh = await api.get(withBranch("/hr/leave", branchParam))
        if (refresh.success) setLeaves(refresh.data.leaveRequests || [])
        setFormData({ ...formData, reason: "" })
      } else {
        toast.error(res.message || "Failed to submit leave request")
      }
    } catch {
      toast.error("Failed to submit leave request")
    } finally {
      setSaving(false)
    }
  }

  async function handleAction(leave: LeaveRequest, action: "approve" | "reject") {
    try {
      const res = await api.put(`/hr/leave/${leave.id}/${action}`, {})
      if (res.success) {
        toast.success(action === "approve" ? "Leave approved!" : "Leave rejected!")
        const refresh = await api.get(withBranch("/hr/leave", branchParam))
        if (refresh.success) setLeaves(refresh.data.leaveRequests || [])
      } else {
        toast.error(res.message || `Failed to ${action} leave`)
      }
    } catch {
      toast.error(`Failed to ${action} leave`)
    }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Leave Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    doc.text(`Total: ${filtered.length} | Pending: ${pendingCount} | Approved: ${approvedCount}`, pw / 2, 41, { align: "center" })

    autoTable(doc, {
      startY: 50,
      head: [["Leave #", "Employee", "Type", "Start", "End", "Days", "Reason", "Status"]],
      body: filtered.map((l) => [
        l.leaveNumber || "—",
        l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "—",
        l.type || "—",
        formatDate(l.startDate),
        formatDate(l.endDate),
        String(l.days),
        l.reason?.slice(0, 30) || "—",
        l.status || "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc)
    setPdfOpen(true)
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "HR", href: "/dashboard/hr" }, { label: "Leave" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground">Submit and approve leave requests</p>
        </div>
        <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2">
          <HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export PDF
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Pending</span><p className="text-2xl font-bold text-amber-600">{loading ? "—" : pendingCount}</p></div>
            <HugeiconsIcon icon={CalendarRemove01Icon} strokeWidth={2} className="size-8 text-amber-500/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Approved</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : approvedCount}</p></div>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-8 text-emerald-500/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><span className="text-sm text-muted-foreground">Rejected</span><p className="text-2xl font-bold text-destructive">{loading ? "—" : rejectedCount}</p></div>
            <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-8 text-destructive/50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
            <CardDescription>Submit a leave application</CardDescription>
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
                <Label>Leave Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="paternity">Paternity</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <span className="text-sm text-muted-foreground">Duration: </span>
                <span className="font-bold">{calcDays(formData.startDate, formData.endDate)} day(s)</span>
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Brief reason for leave" required />
              </div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Submitting..." : "Submit Request"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>{filtered.length} requests</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
                <HugeiconsIcon icon={CalendarRemove01Icon} strokeWidth={2} className="size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No leave requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow key={l.id} className="hover:bg-muted/50">
                        <TableCell>
                          <p className="font-medium">{l.employee?.firstName} {l.employee?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{l.reason}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{l.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatDate(l.startDate)} - {formatDate(l.endDate)}</TableCell>
                        <TableCell>{l.days}d</TableCell>
                        <TableCell>
                          <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {l.status === "pending" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" title="Approve" onClick={() => handleAction(l, "approve")}>
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Reject" onClick={() => handleAction(l, "reject")}>
                                <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-4" />
                              </Button>
                            </div>
                          )}
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

      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Leave_Report_${new Date().toISOString().split("T")[0]}.pdf`} title="Leave Report" />
    </DashboardLayout>
  )
}
