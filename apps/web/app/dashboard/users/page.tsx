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
import { PlusIcon, UserGroupIcon, Search01Icon, Edit02Icon, TrashIcon } from "@hugeicons/core-free-icons"
import { api, formatDate } from "@/lib/api"
import type { User, Branch } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"

const roleColors: Record<string, "default" | "secondary" | "destructive"> = {
  super_admin: "default",
  manager: "secondary",
  cashier: "secondary",
  storekeeper: "secondary",
  accountant: "secondary",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "cashier", branchId: "" })

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, branchRes] = await Promise.all([
          api.get("/users"),
          api.get("/branches"),
        ])
        if (userRes.success) setUsers(userRes.data.users || [])
        if (branchRes.success) setBranches(branchRes.data.branches || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
  })

  function openAdd() {
    setEditingUser(null)
    setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "cashier", branchId: "" })
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setFormData({ name: user.name, email: user.email, phone: user.phone || "", password: "", confirmPassword: "", role: user.role, branchId: user.branch?.id || "" })
    setDialogOpen(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.email) { toast.error("Name and email are required"); return }
    if (!editingUser && !formData.password) { toast.error("Password is required for new users"); return }
    if (formData.password && formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return }
    if (formData.password && formData.password.length < 6) { toast.error("Password must be at least 6 characters"); return }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        branchId: formData.branchId || undefined,
      }
      if (formData.password) payload.password = formData.password
      let res
      if (editingUser) {
        res = await api.put(`/users/${editingUser.id}`, payload)
      } else {
        res = await api.post("/users", payload)
      }
      if (res.success) {
        toast.success(editingUser ? "User updated!" : "User added!")
        setDialogOpen(false)
        setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "cashier", branchId: "" })
        const refresh = await api.get("/users")
        if (refresh.success) setUsers(refresh.data.users || [])
      } else {
        toast.error(res.message || "Failed to save user")
      }
    } catch {
      toast.error("Failed to save user")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return
    try {
      const res = await api.delete(`/users/${user.id}`)
      if (res.success) {
        toast.success("User deleted")
        setUsers((prev) => prev.filter((u) => u.id !== user.id))
      } else {
        toast.error(res.message || "Failed to delete user")
      }
    } catch {
      toast.error("Failed to delete user")
    }
  }

  async function toggleActive(user: User) {
    try {
      const res = await api.put(`/users/${user.id}`, { isActive: !user.isActive })
      if (res.success) {
        toast.success(`User ${!user.isActive ? "activated" : "deactivated"}`)
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      } else {
        toast.error(res.message || "Failed to update user")
      }
    } catch {
      toast.error("Failed to update user")
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Management", href: "/dashboard/branches" }, { label: "Users" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={openAdd}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add User</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{loading ? "Loading..." : `${filtered.length} users`}</CardDescription>
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
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground">Add staff members to manage your store</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[user.role] || "secondary"} className="capitalize">
                        {user.role.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.branch?.name || "All Branches"}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button size="sm" variant="ghost" className="h-8 w-8 p-0" />}>
                          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(user)}>
                            {user.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>
                            <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4" /> Delete
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
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{editingUser ? "Edit User" : "Add User"}</SheetTitle></SheetHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" required />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? "New Password (leave blank to keep)" : "Password *"}</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? "Leave blank to keep current" : "Password"} {...(!editingUser ? { required: true } : {})} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Confirm password" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="storekeeper">Storekeeper</option>
                <option value="accountant">Accountant</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                <option value="">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <SheetFooter className="mt-auto pt-4">
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingUser ? "Save Changes" : "Add User"}</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
