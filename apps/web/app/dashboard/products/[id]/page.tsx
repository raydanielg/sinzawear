"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Separator } from "@workspace/ui/components/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Shirt01Icon, Edit01Icon, Package02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"
import type { Product } from "@/lib/types"

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/products/${params.id}`)
        if (res.success) setProduct(res.data.product)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [params.id])

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Products", href: "/dashboard/products" },
      { label: "Product Details" },
    ]}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
          </Button>
          {loading ? <Skeleton className="h-8 w-48" /> : (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{product?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={product?.status === "active" ? "default" : "secondary"}>{product?.status}</Badge>
                <span className="text-sm text-muted-foreground">{product?.category?.name}</span>
                {product?.brand && <span className="text-sm text-muted-foreground">{product.brand.name}</span>}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" /> Edit</Button>
          <Button variant="destructive"><HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" /> Delete</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : product ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>{product.variants?.length || 0} variants</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants?.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                        <TableCell>{v.color?.name || "—"}</TableCell>
                        <TableCell>{v.size?.name || "—"}</TableCell>
                        <TableCell>{formatTZS(v.costPrice)}</TableCell>
                        <TableCell className="font-medium">{formatTZS(v.sellingPrice)}</TableCell>
                        <TableCell><Badge variant={v.status === "active" ? "default" : "secondary"}>{v.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-6">
                <div className="flex size-24 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="size-24 rounded-xl object-cover" />
                  ) : (
                    <HugeiconsIcon icon={Shirt01Icon} strokeWidth={2} className="size-12" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{product.category?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand</span>
                  <span>{product.brand?.name || "—"}</span>
                </div>
                <Separator />
                {product.description && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Description</span>
                    <span>{product.description}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Product not found</CardContent></Card>
      )}
    </DashboardLayout>
  )
}
