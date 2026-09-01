"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Separator } from "@workspace/ui/components/separator"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, PlusIcon, Delete02Icon } from "@hugeicons/core-free-icons"
import { api } from "@/lib/api"
import type { Category, Brand, Size, Color } from "@/lib/types"

interface VariantForm {
  sku: string
  barcode: string
  costPrice: string
  sellingPrice: string
  reorderLevel: string
  sizeId: string
  colorId: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
  })
  const [variants, setVariants] = useState<VariantForm[]>([
    { sku: "", barcode: "", costPrice: "", sellingPrice: "", reorderLevel: "10", sizeId: "", colorId: "" },
  ])

  useEffect(() => {
    async function fetchMeta() {
      try {
        const [catRes, brandRes, sizeRes, colorRes] = await Promise.all([
          api.get("/products/categories/list"),
          api.get("/products/brands/list"),
          api.get("/products/sizes/list"),
          api.get("/products/colors/list"),
        ])
        if (catRes.success) setCategories(catRes.data.categories || [])
        if (brandRes.success) setBrands(brandRes.data.brands || [])
        if (sizeRes.success) setSizes(sizeRes.data.sizes || [])
        if (colorRes.success) setColors(colorRes.data.colors || [])
      } catch {}
    }
    fetchMeta()
  }, [])

  function addVariant() {
    setVariants([...variants, { sku: "", barcode: "", costPrice: "", sellingPrice: "", reorderLevel: "10", sizeId: "", colorId: "" }])
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index))
  }

  function updateVariant(index: number, field: keyof VariantForm, value: string) {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) { toast.error("Product name is required"); return }
    if (variants.length === 0) { toast.error("At least one variant is required"); return }
    setSaving(true)
    try {
      const res = await api.post("/products", {
        ...formData,
        variants: variants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode || undefined,
          costPrice: Number(v.costPrice) || 0,
          sellingPrice: Number(v.sellingPrice) || 0,
          reorderLevel: Number(v.reorderLevel) || 10,
          sizeId: v.sizeId || undefined,
          colorId: v.colorId || undefined,
        })),
      })
      if (res.success) {
        toast.success("Product created!", { description: res.data.product.name })
        router.push("/dashboard/products")
      } else {
        toast.error(res.message || "Failed to create product")
      }
    } catch {
      toast.error("Failed to create product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Products", href: "/dashboard/products" },
      { label: "New Product" },
    ]}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
          <p className="text-sm text-muted-foreground">Create a new product with variants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Classic Cotton Shirt" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <select id="brand" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}>
                <option value="">Select brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Product description..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Variants</CardTitle>
                <CardDescription>Add size, color, and pricing for each variant</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Variant</Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {variants.map((variant, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Variant {i + 1}</span>
                  {variants.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeVariant(i)}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SKU *</Label>
                    <Input value={variant.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} placeholder="SKU" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Barcode</Label>
                    <Input value={variant.barcode} onChange={(e) => updateVariant(i, "barcode", e.target.value)} placeholder="Barcode" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reorder Level</Label>
                    <Input type="number" value={variant.reorderLevel} onChange={(e) => updateVariant(i, "reorderLevel", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost Price</Label>
                    <Input type="number" value={variant.costPrice} onChange={(e) => updateVariant(i, "costPrice", e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Selling Price *</Label>
                    <Input type="number" value={variant.sellingPrice} onChange={(e) => updateVariant(i, "sellingPrice", e.target.value)} placeholder="0" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Color</Label>
                    <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={variant.colorId} onChange={(e) => updateVariant(i, "colorId", e.target.value)}>
                      <option value="">Select color</option>
                      {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Size</Label>
                    <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={variant.sizeId} onChange={(e) => updateVariant(i, "sizeId", e.target.value)}>
                      <option value="">Select size</option>
                      {sizes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Product"}</Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
