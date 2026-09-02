"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileAddIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import type { Customer, Product } from "@/lib/types"
import { useBranch } from "@/lib/branch-context"
import Link from "next/link"

interface LineItem {
  variantId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  total: number
}

export default function NewProformaPage() {
  const { branchParam } = useBranch()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customerId, setCustomerId] = useState("")
  const [proformaDate, setProformaDate] = useState(new Date().toISOString().split("T")[0])
  const [validUntil, setValidUntil] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<LineItem[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get("/customers"),
          api.get(withBranch("/products", branchParam)),
        ])
        if (custRes.success) setCustomers(custRes.data.customers || [])
        if (prodRes.success) setProducts(prodRes.data.products || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      id: v.id,
      label: `${p.name} - ${v.sku} (${v.color?.name || ""} / ${v.size?.name || ""})`,
      sku: v.sku,
      productName: p.name,
      sellingPrice: v.sellingPrice,
    }))
  )

  function addItem() {
    setItems([...items, { variantId: "", productName: "", sku: "", quantity: 1, unitPrice: 0, total: 0 }])
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "quantity" || field === "unitPrice") {
      updated[index].total = updated[index].quantity * updated[index].unitPrice
    }
    if (field === "variantId") {
      const variant = allVariants.find((v) => v.id === value)
      if (variant) {
        updated[index].productName = variant.productName
        updated[index].sku = variant.sku
        updated[index].unitPrice = variant.sellingPrice
        updated[index].total = updated[index].quantity * variant.sellingPrice
      }
    }
    setItems(updated)
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { toast.error("Please select a customer"); return }
    if (items.length === 0) { toast.error("Please add at least one item"); return }
    setSaving(true)
    try {
      const res = await api.post("/proforma", {
        customerId,
        proformaDate,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice })),
      })
      if (res.success) {
        toast.success("Proforma created successfully!")
        window.location.href = "/dashboard/proforma"
      } else {
        toast.error(res.message || "Failed to create proforma")
      }
    } catch {
      toast.error("Failed to create proforma")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Proforma", href: "/dashboard/proforma" }, { label: "New" }]}>
        <Skeleton className="h-96 w-full rounded-xl" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Proforma", href: "/dashboard/proforma" }, { label: "New Proforma" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Proforma</h1>
          <p className="text-sm text-muted-foreground">Create a proforma invoice for a customer</p>
        </div>
        <Link href="/dashboard/proforma">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} className="size-4" /> Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Proforma Details</CardTitle>
            <CardDescription>Customer and validity information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proforma Date *</Label>
              <Input type="date" value={proformaDate} onChange={(e) => setProformaDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Add products to the proforma</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No items added yet. Click "Add Item" to start.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-5 space-y-1">
                      <Label className="text-xs">Product</Label>
                      <Select value={item.variantId} onValueChange={(v) => updateItem(index, "variantId", v)}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {allVariants.map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} />
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Unit Price</Label>
                      <Input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} />
                    </div>
                    <div className="col-span-3 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Total</Label>
                      <div className="text-sm font-medium py-2">{formatTZS(item.total)}</div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatTZS(total)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/dashboard/proforma"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} className="size-4" />
            {saving ? "Creating..." : "Create Proforma"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
