"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusIcon, Store02Icon, MapPinIcon, PhoneIcon, Edit02Icon, TrashIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate } from "@/lib/api"
import type { Branch } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState({ name: "", code: "", location: "", phone: "", openingBalance: "0" })

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await api.get("/branches")
        if (res.success) setBranches(res.data.branches || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchBranches()
  }, [])

  function openAdd() {
    setEditingBranch(null)
    setFormData({ name: "", code: "", location: "", phone: "", openingBalance: "0" })
    setDialogOpen(true)
  }

  function openEdit(branch: Branch) {
    setEditingBranch(branch)
    setFormData({ name: branch.name, code: branch.code, location: branch.location || "", phone: branch.phone || "", openingBalance: String(branch.openingBalance || 0) })
    setDialogOpen(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.code) { toast.error("Name and code are required"); return }
    setSaving(true)
    try {
      const payload = {
        ...formData,
        openingBalance: Number(formData.openingBalance) || 0,
      }
      let res
      if (editingBranch) {
        res = await api.put(`/branches/${editingBranch.id}`, payload)
      } else {
        res = await api.post("/branches", payload)
      }
      if (res.success) {
        toast.success(editingBranch ? "Branch updated!" : "Branch added!")
        setDialogOpen(false)
        setFormData({ name: "", code: "", location: "", phone: "", openingBalance: "0" })
        const refresh = await api.get("/branches")
        if (refresh.success) setBranches(refresh.data.branches || [])
      } else {
        toast.error(res.message || "Failed to save branch")
      }
    } catch {
      toast.error("Failed to save branch")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(branch: Branch) {
    if (!confirm(`Delete branch "${branch.name}"? This cannot be undone.`)) return
    try {
      const res = await api.delete(`/branches/${branch.id}`)
      if (res.success) {
        toast.success("Branch deleted")
        setBranches((prev) => prev.filter((b) => b.id !== branch.id))
      } else {
        toast.error(res.message || "Failed to delete branch")
      }
    } catch {
      toast.error("Failed to delete branch")
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Management", href: "/dashboard/branches" }, { label: "Branches" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground">Manage all your store locations</p>
        </div>
        <Button onClick={openAdd}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Branch</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
            <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No branches yet</p>
              <p className="text-sm text-muted-foreground">Add your first branch to get started</p>
            </div>
            <Button size="sm" onClick={openAdd}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Branch</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-5" />
                    </div>
                    <div>
                      <span className="font-medium">{branch.name}</span>
                      <div className="text-xs text-muted-foreground font-mono">{branch.code}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={branch.status === "active" ? "default" : "secondary"}>{branch.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button size="sm" variant="ghost" className="h-8 w-8 p-0" />}>
                        <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(branch)}>
                          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" /> Edit Branch
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(branch)}>
                          <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {branch.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-4" />
                      {branch.location}
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={PhoneIcon} strokeWidth={2} className="size-4" />
                      {branch.phone}
                    </div>
                  )}
                  {branch.manager && (
                    <div className="text-muted-foreground">Manager: {branch.manager.name}</div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Opening</div>
                    <div className="text-sm font-medium">{formatTZS(branch.openingBalance)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Staff</div>
                    <div className="text-sm font-medium">{branch._count?.users || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Sales</div>
                    <div className="text-sm font-medium">{branch._count?.sales || 0}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">Created {formatDate(branch.createdAt)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{editingBranch ? "Edit Branch" : "Add Branch"}</SheetTitle></SheetHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Branch name" required />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. BR001" required />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Opening Balance (TZS)</Label>
              <Input type="number" min="0" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })} />
            </div>
            <SheetFooter className="mt-auto pt-4">
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingBranch ? "Save Changes" : "Add Branch"}</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
