"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { Shirt01Icon, PlusIcon, Search01Icon, Package02Icon, Upload01Icon, Download01Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"
import type { Product, Category, Brand } from "@/lib/types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")

  useEffect(() => {
    async function fetchProducts() {
      try {
        const [prodRes, catRes, brandRes] = await Promise.all([
          api.get("/products"),
          api.get("/products/categories/list"),
          api.get("/products/brands/list"),
        ])
        if (prodRes.success) setProducts(prodRes.data.products || [])
        if (catRes.success) setCategories(catRes.data.categories || [])
        if (brandRes.success) setBrands(brandRes.data.brands || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || p.variants?.some((v) => v.sku.toLowerCase().includes(q))
    const matchCat = categoryFilter === "all" || p.categoryId === categoryFilter
    const matchBrand = brandFilter === "all" || p.brandId === brandFilter
    return matchSearch && matchCat && matchBrand
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Products" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog and variants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-4" /> Import</Button>
          <Button variant="outline"><HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Link href="/dashboard/products/new"><Button><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Product</Button></Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
        </div>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="all">All Brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
            <HugeiconsIcon icon={Shirt01Icon} strokeWidth={2} className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">Try changing your filters or add your first product</p>
            </div>
            <Link href="/dashboard/products/new"><Button><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Product</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <Link href={`/dashboard/products/${product.id}`}>
                <CardContent className="p-0">
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="size-16 rounded-lg object-cover" />
                      ) : (
                        <HugeiconsIcon icon={Shirt01Icon} strokeWidth={2} className="size-8" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{product.name}</span>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
                      </div>
                      {product.category && <span className="text-xs text-muted-foreground">{product.category.name}</span>}
                      <span className="text-xs text-muted-foreground">{product.variants?.length || 0} variants</span>
                    </div>
                  </div>
                  <div className="border-t px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {product.variants?.slice(0, 4).map((v) => (
                        <Badge key={v.id} variant="outline" className="gap-1 text-xs">
                          <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-3" />
                          {v.color?.name} {v.size?.name}
                        </Badge>
                      ))}
                      {(product.variants?.length || 0) > 4 && (
                        <Badge variant="outline" className="text-xs">+{(product.variants?.length || 0) - 4}</Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {product.variants && product.variants.length > 0 ? (
                          <>
                            {formatTZS(Math.min(...product.variants.map((v) => v.sellingPrice)))}
                            {product.variants.length > 1 && " - "}
                            {product.variants.length > 1 && formatTZS(Math.max(...product.variants.map((v) => v.sellingPrice)))}
                          </>
                        ) : "—"}
                      </span>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
