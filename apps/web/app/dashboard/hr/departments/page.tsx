"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, PlusIcon, Edit02Icon, TrashIcon } from "@hugeicons/core-free-icons"
import { api, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { Department } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog"

export default function DepartmentsPage() {
  const { branchParam } = useBranch()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/hr/departments", branchParam))
        if (res.success) setDepartments(res.data.departments || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  function openAdd() {
    setEditing(null)
    setFormData({ name: "", description: "" })
    setDialogOpen(true)
  }

  function openEdit(dept: Department) {
    setEditing(dept)
    setFormData({ name: dept.name, description: dept.description || "" })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) { toast.error("Department name is required"); return }
    setSaving(true)
    try {
      const res = editing
        ? await api.put(`/hr/departments/${editing.id}`, formData)
        : await api.post("/hr/departments", formData)
      if (res.success) {
        toast.success(editing ? "Department updated!" : "Department created!")
        setDialogOpen(false)
        const refresh = await api.get(withBranch("/hr/departments", branchParam))
        if (refresh.success) setDepartments(refresh.data.departments || [])
      } else {
        toast.error(res.message || "Failed to save department")
      }
    } catch {
      toast.error("Failed to save department")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(dept: Department) {
    if (!confirm(`Delete department "${dept.name}"?`)) return
    try {
      const res = await api.delete(`/hr/departments/${dept.id}`)
      if (res.success) {
        toast.success("Department deleted")
        setDepartments((prev) => prev.filter((d) => d.id !== dept.id))
      } else {
        toast.error(res.message || "Failed to delete department")
      }
    } catch {
      toast.error("Failed to delete department")
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "HR", href: "/dashboard/hr" }, { label: "Departments" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">Organize employees into departments</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Department
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No departments yet</p>
              <p className="text-sm text-muted-foreground">Create departments to organize your employees</p>
            </div>
            <Button onClick={openAdd} size="sm" className="gap-2">
              <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="group transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(dept)}>
                      <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(dept)}>
                      <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="mt-3 font-semibold text-lg">{dept.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{dept.description || "No description"}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary">{dept._count?.employees || 0} employees</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Department Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Sales" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
