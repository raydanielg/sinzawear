"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusIcon, Store02Icon, MapPinIcon, PhoneIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate } from "@/lib/api"
import type { Branch } from "@/lib/types"

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.code) { toast.error("Name and code are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/branches", {
        ...formData,
        openingBalance: Number(formData.openingBalance) || 0,
      })
      if (res.success) {
        toast.success("Branch added!")
        setDialogOpen(false)
        setFormData({ name: "", code: "", location: "", phone: "", openingBalance: "0" })
        const refresh = await api.get("/branches")
        if (refresh.success) setBranches(refresh.data.branches || [])
      } else {
        toast.error(res.message || "Failed to add branch")
      }
    } catch {
      toast.error("Failed to add branch")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Management", href: "/dashboard/branches" }, { label: "Branches" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground">Manage all your store locations</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Branch</Button>
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
            <Button size="sm" onClick={() => setDialogOpen(true)}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Branch</Button>
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
                  <Badge variant={branch.status === "active" ? "default" : "secondary"}>{branch.status}</Badge>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Branch</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Branch"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
