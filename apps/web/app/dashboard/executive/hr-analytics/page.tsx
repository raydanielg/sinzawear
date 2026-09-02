"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Store02Icon, BanknoteIcon, CalendarRemove01Icon, ChartIcon, RefreshIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Employee, Payroll, LeaveRequest, EmployeeLoan, Branch } from "@/lib/types"

function formatCompact(amount: number) {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(1)}k`
  return String(amount)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function HrAnalyticsPage() {
  const { branches, branchParam } = useBranch()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [station, setStation] = useState("all")
  const [search, setSearch] = useState("")

  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loans, setLoans] = useState<EmployeeLoan[]>([])
  const [allBranches, setAllBranches] = useState<Branch[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const bp = station && station !== "all" ? station : branchParam
      const [empRes, payRes, leaveRes, loanRes, branchRes] = await Promise.all([
        api.get(withBranch("/hr/employees", bp)).catch(() => ({ success: false })),
        api.get(withBranch("/hr/payroll", bp)).catch(() => ({ success: false })),
        api.get(withBranch("/hr/leave", bp)).catch(() => ({ success: false })),
        api.get(withBranch("/transactions/employee-loan", bp)).catch(() => ({ success: false })),
        api.get("/branches").catch(() => ({ success: false })),
      ])
      if (empRes.success) setEmployees(empRes.data.employees || [])
      if (payRes.success) setPayrolls(payRes.data.payrolls || [])
      if (leaveRes.success) setLeaves(leaveRes.data.leaveRequests || [])
      if (loanRes.success) setLoans(loanRes.data.employeeLoans || loanRes.data.loans || [])
      if (branchRes.success) setAllBranches(branchRes.data.branches || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [branchParam, station])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleRefresh() {
    setRefreshing(true)
    fetchData().finally(() => setTimeout(() => setRefreshing(false), 1000))
  }

  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(String(y))

  // Summary stats
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((e) => e.status === "active").length
  const inactiveEmployees = employees.filter((e) => e.status !== "active").length
  const paidEmployees = employees.filter((e) => e.status === "active").length

  const totalBranchesCount = allBranches.length
  const activeBranches = allBranches.filter((b) => b.status !== "inactive").length
  const inactiveBranches = allBranches.filter((b) => b.status === "inactive").length

  const loanBalance = loans.reduce((sum, l) => sum + (l.balance || 0), 0)

  const now = new Date()
  const ongoingLeaves = leaves.filter((l) => {
    if (l.status !== "approved") return false
    const start = new Date(l.startDate)
    const end = new Date(l.endDate)
    return start <= now && end >= now
  }).length

  // Station stats
  const stationStats = useMemo(() => {
    const branchMap: Record<string, { name: string; total: number; active: number; inactive: number; monthly: number; weekly: number; daily: number; ongoingLeaves: number }> = {}
    for (const b of allBranches) {
      branchMap[b.id] = { name: b.name, total: 0, active: 0, inactive: 0, monthly: 0, weekly: 0, daily: 0, ongoingLeaves: 0 }
    }
    for (const emp of employees) {
      const bid = emp.branchId || ""
      if (!branchMap[bid]) {
        branchMap[bid] = { name: emp.branch?.name || "Unassigned", total: 0, active: 0, inactive: 0, monthly: 0, weekly: 0, daily: 0, ongoingLeaves: 0 }
      }
      branchMap[bid].total++
      if (emp.status === "active") branchMap[bid].active++
      else branchMap[bid].inactive++
      if (emp.employmentType === "full_time" || emp.employmentType === "monthly") branchMap[bid].monthly++
      else if (emp.employmentType === "weekly") branchMap[bid].weekly++
      else if (emp.employmentType === "daily" || emp.employmentType === "casual") branchMap[bid].daily++
    }
    for (const l of leaves) {
      if (l.status === "approved") {
        const start = new Date(l.startDate)
        const end = new Date(l.endDate)
        if (start <= now && end >= now) {
          const emp = employees.find((e) => e.id === l.employeeId)
          const bid = emp?.branchId || ""
          if (branchMap[bid]) branchMap[bid].ongoingLeaves++
        }
      }
    }
    return Object.values(branchMap).filter((s) => s.total > 0 || allBranches.length > 0)
  }, [employees, leaves, allBranches])

  const filteredStationStats = useMemo(() => {
    if (!search) return stationStats
    return stationStats.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  }, [stationStats, search])

  // Payroll data for the selected year
  const yearPayrolls = useMemo(() => {
    return payrolls.filter((p) => String(p.year) === year)
  }, [payrolls, year])

  // Monthly payroll chart data
  const monthlyPayrollData = useMemo(() => {
    const months = []
    for (let m = 0; m < 12; m++) {
      const monthPayrolls = yearPayrolls.filter((p) => p.month === m + 1)
      const totalNet = monthPayrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)
      months.push({ label: `${MONTHS[m]} ${year}`, netPay: totalNet })
    }
    return months
  }, [yearPayrolls, year])

  // Monthly payroll overall
  const monthlyOverall = useMemo(() => {
    const months = []
    for (let m = 0; m < 12; m++) {
      const monthPayrolls = yearPayrolls.filter((p) => p.month === m + 1)
      const totalNet = monthPayrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)
      const totalBasic = monthPayrolls.reduce((sum, p) => sum + (p.basicSalary || 0), 0)
      const totalGross = monthPayrolls.reduce((sum, p) => sum + (p.basicSalary || 0) + (p.allowances || 0) + (p.overtimePay || 0), 0)
      const totalDeductions = monthPayrolls.reduce((sum, p) => sum + (p.deductions || 0) + (p.taxDeduction || 0), 0)
      const totalAllowances = monthPayrolls.reduce((sum, p) => sum + (p.allowances || 0), 0)
      const empCount = monthPayrolls.length
      months.push({ label: `${MONTHS[m]} ${year}`, totalNet, totalBasic, totalGross, totalDeductions, totalAllowances, empCount })
    }
    return months
  }, [yearPayrolls, year])

  // Payroll table data
  const payrollTableData = useMemo(() => {
    return yearPayrolls.map((p) => {
      const emp = employees.find((e) => e.id === p.employeeId)
      const branch = allBranches.find((b) => b.id === emp?.branchId)
      return {
        id: p.id,
        month: `${MONTHS[(p.month || 1) - 1]} ${p.year}`,
        station: branch?.name || "—",
        empCount: 1,
        basicSalary: p.basicSalary || 0,
        grossSalary: (p.basicSalary || 0) + (p.allowances || 0) + (p.overtimePay || 0),
        deduction: p.deductions || 0,
        allowance: p.allowances || 0,
        loan: 0,
        socialSecurity: 0,
        healthInsurance: 0,
        paye: p.taxDeduction || 0,
        wcf: 0,
        sdl: 0,
        netAmount: p.netPay || 0,
      }
    })
  }, [yearPayrolls, employees, allBranches])

  // History records (from audit logs or employee changes - we'll use employee createdAt as proxy)
  const historyRecords = useMemo(() => {
    const records: { station: string; employee: string; type: string; date: string; remark: string }[] = []
    for (const emp of employees.slice(0, 20)) {
      const branch = allBranches.find((b) => b.id === emp.branchId)
      records.push({
        station: branch?.name || "—",
        employee: emp.fullName || `${emp.firstName} ${emp.lastName}`,
        type: "Employee Created",
        date: new Date(emp.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        remark: `Employee hired for position: ${emp.position}`,
      })
    }
    for (const loan of loans.slice(0, 10)) {
      const emp = employees.find((e) => e.id === loan.employeeId)
      const branch = allBranches.find((b) => b.id === emp?.branchId)
      records.push({
        station: branch?.name || "—",
        employee: emp?.fullName || `${emp?.firstName || ""} ${emp?.lastName || ""}`,
        type: "Loan Issued",
        date: new Date(loan.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        remark: `Loan of ${formatTZS(loan.principalAmount)} issued, balance: ${formatTZS(loan.balance)}`,
      })
    }
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20)
  }, [employees, loans, allBranches])

  const sectionLinks = [
    { href: "#station_stat_section", label: "Station Stat" },
    { href: "#monthly_payroll_section", label: "Monthly Payroll" },
    { href: "#monthly_payroll_chart_section", label: "Payroll Chart" },
    { href: "#monthly_payroll_overall_section", label: "Monthly Payroll Overall" },
    { href: "#history_record_section", label: "History Records" },
  ]

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "HR", href: "/dashboard/hr" },
      { label: "HR Analytics" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Executive Analytics</h1>
          <p className="text-sm text-muted-foreground">Human resources statistics and overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-full gap-2 sm:w-auto">
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filter Form */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Financial Year</label>
            <Select value={year} onValueChange={(v) => setYear(v ?? String(currentYear))}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Station</label>
            <Select value={station} onValueChange={(v) => setStation(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(branches.length ? branches : allBranches).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchData} disabled={loading} className="gap-2">
            <HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-4" />
            Submit
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* No of Employees */}
        <Card className="border-blue-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">No of Employees</span>
              <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-6 text-blue-600" />
              </div>
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-16" /> : (
              <span className="text-2xl font-bold">{totalEmployees}</span>
            )}
            {!loading && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600">Active: {activeEmployees}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-red-600">Inactive: {inactiveEmployees}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* No of Stations */}
        <Card className="border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">No of Stations</span>
              <div className="flex size-12 items-center justify-center rounded-lg bg-purple-500/10">
                <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-6 text-purple-600" />
              </div>
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-16" /> : (
              <span className="text-2xl font-bold">{totalBranchesCount}</span>
            )}
            {!loading && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600">Active: {activeBranches}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-red-600">Inactive: {inactiveBranches}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Balance */}
        <Card className="border-red-500/30">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Loan Balance</span>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <span className="text-2xl font-bold text-red-600">{formatTZS(loanBalance)}</span>
              )}
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-red-500/10">
              <HugeiconsIcon icon={BanknoteIcon} strokeWidth={2} className="size-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* On-going Leaves */}
        <Card className="border-amber-500/30">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">On-going Leaves</span>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <span className="text-2xl font-bold text-amber-600">{ongoingLeaves}</span>
              )}
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
              <HugeiconsIcon icon={CalendarRemove01Icon} strokeWidth={2} className="size-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Station Stats Section */}
      <Card id="station_stat_section">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {sectionLinks.map((s, i) => (
              <span key={s.href}>
                <a href={s.href} className={i === 0 ? "font-medium text-primary" : "text-muted-foreground hover:text-primary"}>{s.label}</a>
                {i < sectionLinks.length - 1 && <span className="ml-3 text-muted-foreground">|</span>}
              </span>
            ))}
          </div>
          <CardTitle>Station Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-6 pb-4">
            <Input
              placeholder="Search stations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64"
            />
          </div>
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">SN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Employees<br /><span className="text-xs text-emerald-600">Active</span></TableHead>
                    <TableHead>Employees<br /><span className="text-xs text-emerald-600">Active - Paid</span></TableHead>
                    <TableHead>Employees<br /><span className="text-xs text-red-600">Inactive</span></TableHead>
                    <TableHead>Employees<br /><span className="text-xs text-muted-foreground">Monthly Payroll</span></TableHead>
                    <TableHead>Employees<br /><span className="text-xs text-muted-foreground">Weekly Payroll</span></TableHead>
                    <TableHead>Employees<br /><span className="text-xs text-muted-foreground">Daily Payroll</span></TableHead>
                    <TableHead>On-going Leaves</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStationStats.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No data available</TableCell></TableRow>
                  ) : (
                    filteredStationStats.map((s, i) => (
                      <TableRow key={i} className="hover:bg-muted/50">
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.total}</TableCell>
                        <TableCell>{s.active}</TableCell>
                        <TableCell>{s.inactive}</TableCell>
                        <TableCell>{s.monthly}</TableCell>
                        <TableCell>{s.weekly}</TableCell>
                        <TableCell>{s.daily}</TableCell>
                        <TableCell>{s.ongoingLeaves}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Payroll Section */}
      <Card id="monthly_payroll_section">
        <CardHeader>
          <CardTitle>Monthly Payroll Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">SN</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>No of Employees</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Allowance</TableHead>
                    <TableHead>Loan</TableHead>
                    <TableHead>Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollTableData.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No data available in table</TableCell></TableRow>
                  ) : (
                    payrollTableData.map((p, i) => (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{p.month}</TableCell>
                        <TableCell>{p.station}</TableCell>
                        <TableCell>{p.empCount}</TableCell>
                        <TableCell>{formatTZS(p.basicSalary)}</TableCell>
                        <TableCell>{formatTZS(p.grossSalary)}</TableCell>
                        <TableCell>{formatTZS(p.deduction)}</TableCell>
                        <TableCell>{formatTZS(p.allowance)}</TableCell>
                        <TableCell>{formatTZS(p.loan)}</TableCell>
                        <TableCell className="font-medium">{formatTZS(p.netAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Chart Section */}
      <Card id="monthly_payroll_chart_section">
        <CardHeader>
          <CardTitle>Monthly Payroll Payments Chart based on Net Amount</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-80 w-full" /> : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPayrollData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip formatter={(v: number) => formatTZS(Number(v) || 0)} />
                  <Bar dataKey="netPay" fill="#4088cd" radius={[4, 4, 0, 0]} name="Net Pay" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Payroll Overall Section */}
      <Card id="monthly_payroll_overall_section">
        <CardHeader>
          <CardTitle>Monthly Payroll Payments (Based on Net Amount)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Month</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyOverall.map((m) => (
                    <TableRow key={m.label} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{m.label}</TableCell>
                      <TableCell>{m.totalNet > 0 ? formatTZS(m.totalNet) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Records Section */}
      <Card id="history_record_section">
        <CardHeader>
          <CardTitle>Recent Employee History Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">SN</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>History Record Type</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No data available</TableCell></TableRow>
                  ) : (
                    historyRecords.map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/50">
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{r.station}</TableCell>
                        <TableCell className="font-medium">{r.employee}</TableCell>
                        <TableCell><Badge variant="secondary">{r.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{r.date}</TableCell>
                        <TableCell className="text-muted-foreground">{r.remark}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
