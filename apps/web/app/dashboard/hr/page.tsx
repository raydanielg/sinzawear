"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Calendar03Icon, Wallet01Icon, CalendarRemove01Icon, UserAddIcon, ChartIcon, ArrowRightIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Employee, Attendance, Payroll, LeaveRequest } from "@/lib/types"

export default function HRDashboardPage() {
  const { branchParam } = useBranch()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, attRes, payRes, leaveRes] = await Promise.all([
          api.get(withBranch("/hr/employees", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/attendance", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/payroll", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/hr/leave", branchParam)).catch(() => ({ success: false })),
        ])
        if (empRes.success) setEmployees(empRes.data.employees || [])
        if (attRes.success) setAttendance(attRes.data.attendance || [])
        if (payRes.success) setPayrolls(payRes.data.payrolls || [])
        if (leaveRes.success) setLeaves(leaveRes.data.leaveRequests || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const activeEmployees = employees.filter((e) => e.status === "active").length
  const presentToday = attendance.filter((a) => a.status === "present").length
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length
  const totalPayroll = payrolls.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.netPay, 0)

  const stats = [
    { label: "Total Employees", value: employees.length, sub: `${activeEmployees} active`, icon: UserGroupIcon, color: "text-primary", bg: "bg-primary/10", href: "/dashboard/hr/employees" },
    { label: "Present Today", value: presentToday, sub: `${attendance.length} records`, icon: Calendar03Icon, color: "text-emerald-600", bg: "bg-emerald-500/10", href: "/dashboard/hr/attendance" },
    { label: "Total Payroll", value: formatTZS(totalPayroll), sub: `${payrolls.length} records`, icon: Wallet01Icon, color: "text-blue-600", bg: "bg-blue-500/10", href: "/dashboard/hr/payroll" },
    { label: "Pending Leaves", value: pendingLeaves, sub: `${leaves.length} total`, icon: CalendarRemove01Icon, color: "text-amber-600", bg: "bg-amber-500/10", href: "/dashboard/hr/leave" },
  ]

  const quickLinks = [
    { label: "Add Employee", href: "/dashboard/hr/employees/new", icon: UserAddIcon, desc: "Create a new employee record" },
    { label: "Mark Attendance", href: "/dashboard/hr/attendance", icon: Calendar03Icon, desc: "Record daily attendance" },
    { label: "Run Payroll", href: "/dashboard/hr/payroll", icon: Wallet01Icon, desc: "Generate payroll for the month" },
    { label: "Leave Requests", href: "/dashboard/hr/leave", icon: CalendarRemove01Icon, desc: "Review and approve leave" },
  ]

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "HR" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Human Resources</h1>
          <p className="text-sm text-muted-foreground">Manage employees, attendance, payroll, and leave</p>
        </div>
        <Link href="/dashboard/hr/employees/new">
          <Button className="gap-2">
            <HugeiconsIcon icon={UserAddIcon} strokeWidth={2} className="size-4" /> Add Employee
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className="text-xs text-muted-foreground">{stat.sub}</span>
                  </>
                )}
              </div>
              <Link href={stat.href}>
                <div className={`flex size-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} cursor-pointer hover:scale-105 transition-transform`}>
                  <HugeiconsIcon icon={stat.icon} strokeWidth={2} className="size-5" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link, i) => (
          <Link key={i} href={link.href}>
            <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HugeiconsIcon icon={link.icon} strokeWidth={2} className="size-5" />
                  </div>
                  <HugeiconsIcon icon={ArrowRightIcon} strokeWidth={2} className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-3 font-semibold">{link.label}</h3>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
            <CardDescription>Latest additions to your workforce</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No employees yet</p>
                <Link href="/dashboard/hr/employees/new"><Button size="sm" variant="outline">Add Employee</Button></Link>
              </div>
            ) : (
              employees.slice(0, 5).map((emp) => (
                <div key={emp.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</p>
                      <p className="text-sm text-muted-foreground">{emp.position}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status === "active" ? "default" : "secondary"} className="capitalize">{emp.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <CardDescription>Leave requests awaiting approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : leaves.filter((l) => l.status === "pending").length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <HugeiconsIcon icon={CalendarRemove01Icon} strokeWidth={2} className="size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No pending leave requests</p>
              </div>
            ) : (
              leaves.filter((l) => l.status === "pending").slice(0, 5).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{leave.employee?.fullName || "—"}</p>
                    <p className="text-sm text-muted-foreground">{leave.type} - {leave.days} day(s)</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{leave.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
