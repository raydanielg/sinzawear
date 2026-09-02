"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { api, getBranches } from "@/lib/api"
import type { Branch } from "@/lib/types"
import Link from "next/link"

export default function NewStaffPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "cashier", branchId: "" })

  useEffect(() => {
    async function fetchBranches() {
      try {
        const list = await getBranches()
        setBranches(list)
      } catch {}
    }
    fetchBranches()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) { toast.error("Name, email, and password are required"); return }
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return }
    setSaving(true)
    try {
      const res = await api.post("/users", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
        branchId: formData.branchId || undefined,
      })
      if (res.success) {
        toast.success("Staff member added successfully!")
        window.location.href = "/dashboard/users"
      } else {
        toast.error(res.message || "Failed to add staff")
      }
    } catch {
      toast.error("Failed to add staff")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Users", href: "/dashboard/users" }, { label: "Add Staff" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Staff</h1>
          <p className="text-sm text-muted-foreground">Create a new staff member account</p>
        </div>
        <Link href="/dashboard/users">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} className="size-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
          <CardDescription>Enter the staff member details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Password" required />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Confirm password" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="storekeeper">Storekeeper</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/dashboard/users"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={saving} className="gap-2">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
                {saving ? "Adding..." : "Add Staff"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
