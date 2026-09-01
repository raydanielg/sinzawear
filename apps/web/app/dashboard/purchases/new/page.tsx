"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, PlusIcon, Delete02Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"
import type { Supplier, Branch, Product } from "@/lib/types"

interface PurchaseItem {
  variantId: string
  quantity: string
  unitCost: string
}

export default function NewPurchasePage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: "",
    branchId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [items, setItems] = useState<PurchaseItem[]>([{ variantId: "", quantity: "1", unitCost: "0" }])

  useEffect(() => {
    async function fetchMeta() {
      try {
        const [supRes, branchRes, prodRes] = await Promise.all([
          api.get("/suppliers"),
          api.get("/branches"),
          api.get("/products"),
        ])
        if (supRes.success) setSuppliers(supRes.data.suppliers || [])
        if (branchRes.success) setBranches(branchRes.data.branches || [])
        if (prodRes.success) setProducts(prodRes.data.products || [])
      } catch {}
    }
    fetchMeta()
  }, [])

  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      id: v.id,
      label: `${p.name} - ${v.sku} (${v.color?.name || ""} / ${v.size?.name || ""})`,
      costPrice: v.costPrice,
    }))
  )

  function addItem() { setItems([...items, { variantId: "", quantity: "1", unitCost: "0" }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: keyof PurchaseItem, value: string) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const totalCost = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitCost)), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.supplierId || !formData.branchId) { toast.error("Select supplier and branch"); return }
    if (items.some((i) => !i.variantId)) { toast.error("Select a product for each item"); return }
    setSaving(true)
    try {
      const res = await api.post("/purchases", {
        ...formData,
        items: items.map((i) => ({ variantId: i.variantId, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })),
      })
      if (res.success) {
        toast.success("Purchase created!", { description: res.data.purchase?.purchaseNo })
        router.push("/dashboard/purchases")
      } else {
        toast.error(res.message || "Failed to create purchase")
      }
    } catch {
      toast.error("Failed to create purchase")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Purchasing", href: "/dashboard/purchases" },
      { label: "New Purchase" },
    ]}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Purchase</h1>
          <p className="text-sm text-muted-foreground">Receive stock from a supplier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Purchase Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} required>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Branch *</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} required>
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Items</CardTitle>
                <CardDescription>Products to receive</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Item</Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={item.variantId}
                    onChange={(e) => {
                      updateItem(i, "variantId", e.target.value)
                      const v = allVariants.find((v) => v.id === e.target.value)
                      if (v) updateItem(i, "unitCost", String(v.costPrice))
                    }}
                  >
                    <option value="">Select product variant</option>
                    {allVariants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />
                </div>
                <div className="w-32 space-y-1">
                  <Label className="text-xs">Unit Cost</Label>
                  <Input type="number" min="0" value={item.unitCost} onChange={(e) => updateItem(i, "unitCost", e.target.value)} />
                </div>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(i)}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex justify-end border-t pt-3">
              <span className="text-sm text-muted-foreground">Total: <span className="text-lg font-bold">{formatTZS(totalCost)}</span></span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Purchase"}</Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
