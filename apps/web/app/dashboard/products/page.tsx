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
import { api, formatTZS, withBranch } from "@/lib/api"
import type { Product, Category, Brand } from "@/lib/types"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useBranch } from "@/lib/branch-context"

export default function ProductsPage() {
  const { branchParam } = useBranch()
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
          api.get(withBranch("/products", branchParam)),
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
  }, [branchParam])

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || p.variants?.some((v) => v.sku.toLowerCase().includes(q))
    const matchCat = categoryFilter === "all" || p.categoryId === categoryFilter
    const matchBrand = brandFilter === "all" || p.brandId === brandFilter
    return matchSearch && matchCat && matchBrand
  })

  function exportProducts() {
    if (filtered.length === 0) { toast.error("No products to export"); return }
    const headers = ["Name", "Category", "Brand", "Status", "Variants", "Min Price", "Max Price"]
    const rows = filtered.map((p) => [
      p.name,
      p.category?.name || "",
      p.brand?.name || "",
      p.status,
      String(p.variants?.length || 0),
      p.variants?.length ? formatTZS(Math.min(...p.variants.map((v) => v.sellingPrice))) : "",
      p.variants?.length ? formatTZS(Math.max(...p.variants.map((v) => v.sellingPrice))) : "",
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `Products_${new Date().toISOString().split("T")[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} products to CSV`)
  }

  function exportProductsPDF() {
    if (filtered.length === 0) { toast.error("No products to export"); return }
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Product Catalog Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 45,
      head: [["Product", "Category", "Variants", "Price Range", "Status"]],
      body: filtered.map((p) => [
        p.name,
        p.category?.name || "—",
        String(p.variants?.length || 0),
        p.variants?.length ? `${formatTZS(Math.min(...p.variants.map((v) => v.sellingPrice)))} - ${formatTZS(Math.max(...p.variants.map((v) => v.sellingPrice)))}` : "—",
        p.status,
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 15, right: 15 },
    })
    doc.save(`Products_Report_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  async function importProducts(file: File) {
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) { toast.error("CSV file is empty or invalid"); return }
    const headers = lines[0]?.split(",").map((h) => h.replace(/"/g, "").trim()) || []
    let success = 0, failed = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]?.split(",").map((v) => v.replace(/"/g, "").trim()) || []
      const name = values[headers.indexOf("Name")] || values[0] || ""
      if (!name) { failed++; continue }
      try {
        const res = await api.post("/products", { name })
        if (res.success) success++; else failed++
      } catch { failed++ }
    }
    toast.success(`Imported ${success} products${failed > 0 ? `, ${failed} failed` : ""}`)
    if (success > 0) {
      const refresh = await api.get("/products")
      if (refresh.success) setProducts(refresh.data.products || [])
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Products" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog and variants</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="hidden sm:flex" onClick={exportProducts}><HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button variant="outline" className="hidden sm:flex" onClick={() => {
            const input = document.createElement("input")
            input.type = "file"; input.accept = ".csv"
            input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) importProducts(f) }
            input.click()
          }}><HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-4" /> Import</Button>
          <Link href="/dashboard/products/new"><Button><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Product</Button></Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-48">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
        </div>
        <div className="flex gap-2">
          <select className="h-9 flex-1 rounded-md border bg-background px-3 text-sm sm:flex-none" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="h-9 flex-1 rounded-md border bg-background px-3 text-sm sm:flex-none" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="all">All Brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
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
