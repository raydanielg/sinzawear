"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Delete02Icon, ShoppingCart01Icon, CheckmarkCircle02Icon, BarcodeIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import type { Product, Category } from "@/lib/types"
import { useBranch } from "@/lib/branch-context"

interface CartItem {
  variantId: string
  productName: string
  sku: string
  colorName: string
  sizeName: string
  price: number
  quantity: number
  stock: number
}

const PAYMENT_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "Mobile Money", value: "mobile_money" },
  { label: "Card", value: "card" },
  { label: "Bank", value: "bank" },
]

export default function POSPage() {
  const { branchParam } = useBranch()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [processing, setProcessing] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [amountReceived, setAmountReceived] = useState(0)

  const loadProducts = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(withBranch("/products", branchParam)),
        api.get("/products/categories/list"),
      ])
      if (prodRes.success) setProducts(prodRes.data.products || [])
      if (catRes.success) setCategories(catRes.data.categories || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [branchParam])

  useEffect(() => { loadProducts() }, [loadProducts])

  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      ...v,
      product: { id: p.id, name: p.name, image: p.image },
      categoryName: p.category?.name || "",
      categoryId: p.categoryId,
      colorName: v.color?.name || "",
      sizeName: v.size?.name || "",
    }))
  )

  const filtered = allVariants.filter((v) => {
    const q = search.toLowerCase()
    const matchSearch = v.product.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q) || v.barcode?.toLowerCase().includes(q)
    const matchCat = activeCategory === "all" || v.categoryId === activeCategory
    return matchSearch && matchCat
  })

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Math.max(0, subtotal - discount)
  const change = Math.max(0, amountReceived - total)

  function addToCart(variant: typeof allVariants[0]) {
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id)
      if (existing) {
        return prev.map((item) => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, {
        variantId: variant.id,
        productName: variant.product.name,
        sku: variant.sku,
        colorName: variant.colorName,
        sizeName: variant.sizeName,
        price: variant.sellingPrice,
        quantity: 1,
        stock: 999,
      }]
    })
  }

  function updateQty(variantId: string, delta: number) {
    setCart((prev) => prev.map((item) => item.variantId === variantId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
  }

  function removeFromCart(variantId: string) {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId))
  }

  async function completeSale() {
    if (cart.length === 0) return
    setProcessing(true)
    try {
      const res = await api.post("/sales", {
        items: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        payments: [{ method: paymentMethod, amount: total }],
        discount,
      })
      if (res.success) {
        toast.success("Sale completed!", { description: `Receipt: ${res.data.sale.saleNumber}` })
        setCart([])
        setDiscount(0)
        setCheckoutOpen(false)
        setAmountReceived(0)
      } else {
        toast.error(res.message || "Failed to complete sale")
      }
    } catch {
      toast.error("Failed to complete sale. Is the backend running?")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sales", href: "/dashboard/pos" }, { label: "POS" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-sm text-muted-foreground">Search products, add to cart, and complete sales</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search product by name, SKU, barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
            </div>
            <Button variant="outline" size="icon" className="shrink-0" title="Scan barcode" onClick={() => {
              const input = prompt("Enter or scan barcode:")
              if (input) {
                const match = allVariants.find((v) => v.barcode === input || v.sku.toLowerCase() === input.toLowerCase())
                if (match) addToCart(match)
                else toast.error("No product found for that barcode")
              }
            }}>
              <HugeiconsIcon icon={BarcodeIcon} strokeWidth={2} className="size-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeCategory === "all" ? "default" : "outline"} onClick={() => setActiveCategory("all")}>All</Button>
            {categories.map((cat) => (
              <Button key={cat.id} size="sm" variant={activeCategory === cat.id ? "default" : "outline"} onClick={() => setActiveCategory(cat.id)}>{cat.name}</Button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No products found. Add products first.</CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((v) => (
                <Card key={v.id} className="cursor-pointer transition-all hover:ring-2 hover:ring-primary" onClick={() => addToCart(v)}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{v.product.name}</span>
                        <span className="text-xs text-muted-foreground">{v.colorName} / {v.sizeName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{v.sku}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{formatTZS(v.sellingPrice)}</span>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Add</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="lg:sticky lg:top-4 h-fit order-1 lg:order-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={ShoppingCart01Icon} strokeWidth={2} className="size-5" />
              Current Sale ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Cart is empty. Click products to add.</div>
            ) : (
              <>
                <ScrollArea className="max-h-64">
                  <div className="flex flex-col gap-2 pr-3">
                    {cart.map((item) => (
                      <div key={item.variantId} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                        <div className="flex flex-1 flex-col gap-0.5">
                          <span className="text-sm font-medium">{item.productName}</span>
                          <span className="text-xs text-muted-foreground">{item.colorName} / {item.sizeName}</span>
                          <span className="text-xs font-medium">{formatTZS(item.price)} x {item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.variantId, -1)}>-</Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.variantId, 1)}>+</Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeFromCart(item.variantId)}>
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatTZS(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <Input type="number" min={0} max={subtotal} value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="h-7 w-28 text-right text-sm" />
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold">{formatTZS(total)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Payment Method</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAYMENT_METHODS.map((method) => (
                      <Button key={method.value} size="sm" variant={paymentMethod === method.value ? "default" : "outline"} className="text-xs" onClick={() => setPaymentMethod(method.value)}>
                        {method.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)}>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
                  Complete Sale
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Checkout</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold">{formatTZS(total)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <Button key={method.value} size="sm" variant={paymentMethod === method.value ? "default" : "outline"} className="text-xs" onClick={() => setPaymentMethod(method.value)}>
                    {method.label}
                  </Button>
                ))}
              </div>
            </div>
            {paymentMethod === "cash" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Received</label>
                  <Input type="number" min={0} value={amountReceived || ""} onChange={(e) => setAmountReceived(Number(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Change</span>
                  <span className="text-lg font-bold">{formatTZS(change)}</span>
                </div>
              </>
            )}
          </div>
          <SheetFooter className="mt-auto pt-4">
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
              <Button onClick={completeSale} disabled={processing || (paymentMethod === "cash" && amountReceived < total)}>
                {processing ? "Processing..." : "Complete Payment"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
