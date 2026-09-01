"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings05Icon } from "@hugeicons/core-free-icons"
import { api } from "@/lib/api"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState({ name: "", phone: "", email: "", address: "" })
  const [system, setSystem] = useState({ currency: "TZS", receiptPrefix: "SF", invoicePrefix: "INV", lowStockThreshold: "10", taxRate: "0", loyaltyRate: "1" })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get("/settings")
        if (res.success && res.data) {
          if (res.data.business) setBusiness(res.data.business)
          if (res.data.system) setSystem(res.data.system)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put("/settings/business", business)
      if (res.success) toast.success("Business settings saved!")
      else toast.error(res.message || "Failed to save")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSystem(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put("/settings/system", {
        ...system,
        lowStockThreshold: Number(system.lowStockThreshold),
        taxRate: Number(system.taxRate),
        loyaltyRate: Number(system.loyaltyRate),
      })
      if (res.success) toast.success("System settings saved!")
      else toast.error(res.message || "Failed to save")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your business settings</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>General business details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} placeholder="Sinza Fashion" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="+255 700 000 000" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} placeholder="info@sinza.co.tz" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} placeholder="Dar es Salaam, Tanzania" rows={2} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Receipts, currency, and thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSystem} className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={system.currency} onChange={(e) => setSystem({ ...system, currency: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Receipt Prefix</Label>
                  <Input value={system.receiptPrefix} onChange={(e) => setSystem({ ...system, receiptPrefix: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input value={system.invoicePrefix} onChange={(e) => setSystem({ ...system, invoicePrefix: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Low Stock Threshold</Label>
                  <Input type="number" value={system.lowStockThreshold} onChange={(e) => setSystem({ ...system, lowStockThreshold: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" value={system.taxRate} onChange={(e) => setSystem({ ...system, taxRate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Loyalty Points Rate (per TZS spent)</Label>
                <Input type="number" value={system.loyaltyRate} onChange={(e) => setSystem({ ...system, loyaltyRate: e.target.value })} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
