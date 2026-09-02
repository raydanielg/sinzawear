"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { TruckIcon, ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { api } from "@/lib/api"
import Link from "next/link"

export default function NewSupplierPage() {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "", tin: "", contactPerson: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) { toast.error("Supplier name is required"); return }
    setSaving(true)
    try {
      const res = await api.post("/purchases/suppliers", formData)
      if (res.success) {
        toast.success("Supplier added successfully!")
        window.location.href = "/dashboard/purchases/suppliers"
      } else {
        toast.error(res.message || "Failed to add supplier")
      }
    } catch {
      toast.error("Failed to add supplier")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Suppliers", href: "/dashboard/purchases/suppliers" }, { label: "Add Supplier" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Supplier</h1>
          <p className="text-sm text-muted-foreground">Create a new supplier record</p>
        </div>
        <Link href="/dashboard/purchases/suppliers">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} className="size-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
          <CardDescription>Enter the supplier details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Company or supplier name" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>TIN (Tax ID)</Label>
                <Input value={formData.tin} onChange={(e) => setFormData({ ...formData, tin: e.target.value })} placeholder="Tax identification number" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Contact person name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Physical address" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/dashboard/purchases/suppliers"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={saving} className="gap-2">
                <HugeiconsIcon icon={TruckIcon} strokeWidth={2} className="size-4" />
                {saving ? "Adding..." : "Add Supplier"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
