"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BanknoteIcon, RefreshIcon, PlusIcon, Edit02Icon, Search01Icon,
  ArrowDataTransferHorizontalIcon, CoinsIcon, Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"

interface AccountChild {
  id: string
  name: string
  code: string
  currency: string
  balance: number
  status: string
  branch?: { name: string } | null
  group?: { name: string } | null
}

interface ParentAccount {
  id: string
  name: string
  code: string
  currency: string
  balance: number
  status: string
  children: AccountChild[]
  computedBalance: number
}

interface AccountSection {
  name: string
  totalBalance: number
  parentAccounts: ParentAccount[]
}

interface PettyCashSection {
  name: string
  totalBalance: number
  parentAccounts: ParentAccount[]
}

interface BankingData {
  bank: AccountSection
  cashOnHand: AccountSection & { pettyCash: PettyCashSection }
  groups: { id: string; name: string; type: string }[]
  allAccounts: AccountChild[]
}

export default function BankingPage() {
  const { branches, branchParam } = useBranch()
  const [data, setData] = useState<BankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<AccountChild | null>(null)
  const [saving, setSaving] = useState(false)
  const [station, setStation] = useState("all")

  const [formData, setFormData] = useState({
    name: "", code: "", currency: "TZS", balance: "",
    groupId: "", parentId: "", branchId: "", status: "active",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const bp = station && station !== "all" ? station : branchParam
      const res = await api.get(withBranch("/accounting/banking", bp)).catch(() => ({ success: false }))
      if (res.success) setData(res.data)
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

  function openAdd(parentId?: string, parentName?: string) {
    setEditing(null)
    setFormData({
      name: "", code: "", currency: "TZS", balance: "",
      groupId: "", parentId: parentId || "", branchId: "", status: "active",
    })
    setSheetOpen(true)
  }

  function openEdit(account: AccountChild) {
    setEditing(account)
    setFormData({
      name: account.name,
      code: account.code || "",
      currency: account.currency || "TZS",
      balance: String(account.balance || 0),
      groupId: account.group?.id || "",
      parentId: "",
      branchId: account.branch?.id || "",
      status: account.status || "active",
    })
    setSheetOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) { toast.error("Account name is required"); return }
    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        code: formData.code || undefined,
        currency: formData.currency,
        balance: Number(formData.balance) || 0,
        groupId: formData.groupId || undefined,
        parentId: formData.parentId || undefined,
        branchId: formData.branchId || undefined,
        status: formData.status,
      }
      const res = editing
        ? await api.put(`/accounting/${editing.id}`, payload)
        : await api.post("/accounting", payload)
      if (res.success) {
        toast.success(editing ? "Account updated!" : "Account created!")
        setSheetOpen(false)
        fetchData()
      } else {
        toast.error(res.message || "Failed to save account")
      }
    } catch {
      toast.error("Failed to save account")
    } finally {
      setSaving(false)
    }
  }

  function filterAccounts(accounts: AccountChild[]) {
    if (!search) return accounts
    return accounts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
  }

  function renderBalance(balance: number) {
    const isPositive = balance >= 0
    return (
      <span className={isPositive ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
        {formatTZS(Math.abs(balance))}
        {!isPositive && " (DR)"}
      </span>
    )
  }

  function renderSection(section: AccountSection | null, sectionTitle: string) {
    if (!section) return null
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{sectionTitle}: TZS</CardTitle>
              <CardDescription>
                Total Balance: {renderBalance(section.totalBalance)}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-full gap-2 sm:w-auto">
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Balance
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Account Details</TableHead>
                    <TableHead>Parent Account</TableHead>
                    <TableHead>Account Balance</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.parentAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    section.parentAccounts.map((parent, idx) => (
                      <SectionRows
                        key={parent.id}
                        parent={parent}
                        index={idx + 1}
                        onAdd={() => openAdd(parent.id, parent.name)}
                        onEdit={openEdit}
                        filteredChildren={filterAccounts(parent.children)}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Finance", href: "/dashboard/expenses" },
      { label: "Banking & Cash" },
    ]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banking & Cash Management</h1>
          <p className="text-sm text-muted-foreground">Bank accounts, cash on hand, and petty cash balances</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/dashboard/transactions/fund-transfer">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} strokeWidth={2} className="size-4" />
              Fund Transfer
            </Button>
          </Link>
          <Button onClick={() => openAdd()} className="w-full gap-2 sm:w-auto">
            <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Station</label>
            <Select value={station} onValueChange={(v) => setStation(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-64">
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" />
          </div>
          <Button onClick={fetchData} disabled={loading} className="gap-2">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />
            Submit
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-blue-500/30">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Bank Total</span>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <span className="text-2xl font-bold">{formatTZS(data?.bank.totalBalance || 0)}</span>
              )}
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
              <HugeiconsIcon icon={BanknoteIcon} strokeWidth={2} className="size-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Cash on Hand</span>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <span className="text-2xl font-bold">{formatTZS(data?.cashOnHand.totalBalance || 0)}</span>
              )}
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-purple-500/10">
              <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Petty Cash</span>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <span className="text-2xl font-bold">{formatTZS(data?.cashOnHand.pettyCash?.totalBalance || 0)}</span>
              )}
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
              <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Section */}
      {renderSection(data?.bank || null, "Bank")}

      {/* Cash on Hand Section */}
      {data?.cashOnHand && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Cash on Hand: TZS</CardTitle>
                <CardDescription>
                  Total Balance: {renderBalance(data.cashOnHand.totalBalance)}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-full gap-2 sm:w-auto">
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Balance
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Account Details</TableHead>
                      <TableHead>Parent Account</TableHead>
                      <TableHead>Account Balance</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Mobile Money parent */}
                    {data.cashOnHand.parentAccounts.map((parent, idx) => (
                      <SectionRows
                        key={parent.id}
                        parent={parent}
                        index={idx + 1}
                        onAdd={() => openAdd(parent.id, parent.name)}
                        onEdit={openEdit}
                        filteredChildren={filterAccounts(parent.children)}
                      />
                    ))}
                    {/* Petty Cash parent */}
                    {data.cashOnHand.pettyCash?.parentAccounts.map((parent, idx) => (
                      <SectionRows
                        key={parent.id}
                        parent={parent}
                        index={data.cashOnHand.parentAccounts.length + idx + 1}
                        onAdd={() => openAdd(parent.id, parent.name)}
                        onEdit={openEdit}
                        filteredChildren={filterAccounts(parent.children)}
                      />
                    ))}
                    {data.cashOnHand.parentAccounts.length === 0 && data.cashOnHand.pettyCash?.parentAccounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No accounts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Account" : "Add New Account"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Account Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. CRDB, M-pesa, Petty Cash" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v ?? "TZS" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TZS">TZS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input type="number" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} placeholder="0" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Account Group</Label>
              <Select value={formData.groupId} onValueChange={(v) => setFormData({ ...formData, groupId: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select group (optional)" /></SelectTrigger>
                <SelectContent>
                  {data?.groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Station / Branch</Label>
              <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select branch (optional)" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v ?? "active" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SheetFooter>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving..." : editing ? "Update Account" : "Create Account"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}

function SectionRows({
  parent,
  index,
  onAdd,
  onEdit,
  filteredChildren,
}: {
  parent: ParentAccount
  index: number
  onAdd: () => void
  onEdit: (a: AccountChild) => void
  filteredChildren: AccountChild[]
}) {
  return (
    <>
      <TableRow className="bg-muted/30">
        <TableCell>{index}</TableCell>
        <TableCell>
          <span className="font-semibold text-muted-foreground">{parent.name}</span>
        </TableCell>
        <TableCell>—</TableCell>
        <TableCell>
          <span className={parent.computedBalance >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
            {formatTZS(Math.abs(parent.computedBalance))}
            {parent.computedBalance < 0 && " (DR)"}
          </span>
        </TableCell>
        <TableCell>
          <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" onClick={onAdd}>
            Add New
          </Button>
        </TableCell>
      </TableRow>
      {filteredChildren.map((child) => (
        <TableRow key={child.id} className="hover:bg-muted/50">
          <TableCell></TableCell>
          <TableCell className="pl-8">{child.name}{child.branch ? ` (${child.branch.name})` : ""}</TableCell>
          <TableCell className="text-muted-foreground">{parent.name}</TableCell>
          <TableCell>{renderBalanceValue(child.balance)}</TableCell>
          <TableCell>
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" onClick={() => onEdit(child)}>
              Edit
            </Button>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" disabled>
              Statement
            </Button>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" disabled>
              Reconcile
            </Button>
          </div>
        </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function renderBalanceValue(balance: number) {
  const isPositive = balance >= 0
  return (
    <span className={isPositive ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
      {formatTZS(Math.abs(balance))}
      {!isPositive && " (DR)"}
    </span>
  )
}
