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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusIcon, ShieldKeyIcon } from "@hugeicons/core-free-icons"
import { api } from "@/lib/api"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  _count?: { users: number }
}

const allPermissions = [
  "pos.access", "sales.view", "sales.create", "sales.refund",
  "products.view", "products.create", "products.edit",
  "inventory.view", "inventory.adjust", "inventory.transfer",
  "purchases.view", "purchases.create", "suppliers.manage",
  "customers.view", "customers.create",
  "expenses.view", "expenses.create", "cash.register",
  "reports.view", "branches.manage", "users.manage", "roles.manage",
  "audit.view", "settings.manage",
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await api.get("/roles")
        if (res.success) setRoles(res.data.roles || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchRoles()
  }, [])

  function togglePerm(perm: string) {
    setSelectedPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) { toast.error("Role name is required"); return }
    setSaving(true)
    try {
      const res = await api.post("/roles", { ...formData, permissions: selectedPerms })
      if (res.success) {
        toast.success("Role created!")
        setDialogOpen(false)
        setFormData({ name: "", description: "" })
        setSelectedPerms([])
        const refresh = await api.get("/roles")
        if (refresh.success) setRoles(refresh.data.roles || [])
      } else {
        toast.error(res.message || "Failed to create role")
      }
    } catch {
      toast.error("Failed to create role")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Management", href: "/dashboard/branches" },
      { label: "Roles & Permissions" },
    ]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Define roles and assign permissions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Role</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>{loading ? "Loading..." : `${roles.length} roles`}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={ShieldKeyIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No roles defined</p>
                <p className="text-sm text-muted-foreground">Create roles to manage user permissions</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium capitalize">{role.name.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{role.description || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).slice(0, 5).map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                        {(role.permissions || []).length > 5 && (
                          <Badge variant="outline" className="text-xs">+{role.permissions.length - 5} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{role._count?.users || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Role</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Branch Manager" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Role description" />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto rounded-md border p-3">
                {allPermissions.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm)}
                      onChange={() => togglePerm(perm)}
                      className="size-4 rounded border"
                    />
                    <span className="font-mono text-xs">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Role"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
