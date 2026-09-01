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
import { api } from "@/lib/api"
import type { Branch, Product } from "@/lib/types"

interface TransferItem {
  variantId: string
  quantity: string
}

export default function NewTransferPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [fromBranchId, setFromBranchId] = useState("")
  const [toBranchId, setToBranchId] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<TransferItem[]>([{ variantId: "", quantity: "1" }])

  useEffect(() => {
    async function fetchMeta() {
      try {
        const [branchRes, prodRes] = await Promise.all([
          api.get("/branches"),
          api.get("/products"),
        ])
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
    }))
  )

  function addItem() { setItems([...items, { variantId: "", quantity: "1" }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: keyof TransferItem, value: string) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromBranchId || !toBranchId) { toast.error("Select source and destination branches"); return }
    if (fromBranchId === toBranchId) { toast.error("Source and destination must be different"); return }
    if (items.some((i) => !i.variantId)) { toast.error("Select a product for each item"); return }
    setSaving(true)
    try {
      const res = await api.post("/inventory/transfers", {
        fromBranchId, toBranchId, notes,
        items: items.map((i) => ({ variantId: i.variantId, quantity: Number(i.quantity) })),
      })
      if (res.success) {
        toast.success("Transfer created!", { description: res.data.transfer?.transferNo })
        router.push("/dashboard/inventory/transfers")
      } else {
        toast.error(res.message || "Failed to create transfer")
      }
    } catch {
      toast.error("Failed to create transfer")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Inventory", href: "/dashboard/inventory" },
      { label: "Transfers", href: "/dashboard/inventory/transfers" },
      { label: "New Transfer" },
    ]}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Stock Transfer</h1>
          <p className="text-sm text-muted-foreground">Move stock between branches</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Transfer Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From Branch *</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={fromBranchId} onChange={(e) => setFromBranchId(e.target.value)} required>
                <option value="">Select source branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>To Branch *</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={toBranchId} onChange={(e) => setToBranchId(e.target.value)} required>
                <option value="">Select destination branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Items</CardTitle>
                <CardDescription>Products to transfer</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Item</Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={item.variantId} onChange={(e) => updateItem(i, "variantId", e.target.value)}>
                    <option value="">Select product variant</option>
                    {allVariants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />
                </div>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(i)}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Transfer"}</Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
