"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusIcon, CoinsIcon, Search01Icon, TrashIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch, getBranches } from "@/lib/api"
import type { Expense, Branch } from "@/lib/types"
import { useBranch } from "@/lib/branch-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export default function ExpensesPage() {
  const { branchParam } = useBranch()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ amount: "", description: "", category: "", branchId: "", date: new Date().toISOString().split("T")[0] })

  useEffect(() => {
    async function fetchData() {
      try {
        const [expRes, branchList] = await Promise.all([
          api.get(withBranch("/expenses", branchParam)),
          getBranches(),
        ])
        if (expRes.success) setExpenses(expRes.data.expenses || [])
        setBranches(branchList)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase()
    return e.description?.toLowerCase().includes(q) || e.category?.name?.toLowerCase().includes(q)
  })

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.amount || !formData.description) { toast.error("Amount and description are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/expenses", {
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category || undefined,
        branchId: formData.branchId || undefined,
        date: formData.date,
      })
      if (res.success) {
        toast.success("Expense added!")
        setDialogOpen(false)
        setFormData({ amount: "", description: "", category: "", branchId: "", date: new Date().toISOString().split("T")[0] })
        const refresh = await api.get("/expenses")
        if (refresh.success) setExpenses(refresh.data.expenses || [])
      } else {
        toast.error(res.message || "Failed to add expense")
      }
    } catch {
      toast.error("Failed to add expense")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(expense: Expense) {
    if (!confirm("Delete this expense? This cannot be undone.")) return
    try {
      const res = await api.delete(`/expenses/${expense.id}`)
      if (res.success) {
        toast.success("Expense deleted")
        setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
      } else {
        toast.error(res.message || "Failed to delete expense")
      }
    } catch {
      toast.error("Failed to delete expense")
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Finance", href: "/dashboard/expenses" }, { label: "Expenses" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track all branch expenses</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Expense</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="text-2xl font-bold">{loading ? "—" : formatTZS(totalExpenses)}</span>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Records</span>
              <span className="text-2xl font-bold">{loading ? "—" : expenses.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Average</span>
              <span className="text-2xl font-bold">{loading ? "—" : formatTZS(expenses.length ? totalExpenses / expenses.length : 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>All recorded expenses across branches</CardDescription>
            </div>
            <div className="relative w-full sm:w-48">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No expenses found</p>
                <p className="text-sm text-muted-foreground">Track your business expenses here</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><Badge variant="outline">{e.category?.name || "Other"}</Badge></TableCell>
                    <TableCell>{e.description || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{e.branch?.name || "—"}</TableCell>
                    <TableCell className="font-medium text-destructive">{formatTZS(e.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{e.user?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button size="sm" variant="ghost" className="h-8 w-8 p-0" />}>
                          <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(e)}>
                            <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4" /> Delete Expense
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader><SheetTitle>Add Expense</SheetTitle></SheetHeader>
          <form onSubmit={handleAdd} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="space-y-2">
                <Label>Amount (TZS) *</Label>
                <Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Expense description" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Rent, Utilities, Transport" />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                  <option value="">All branches</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
            </div>
            <SheetFooter className="border-t">
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Expense"}</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
