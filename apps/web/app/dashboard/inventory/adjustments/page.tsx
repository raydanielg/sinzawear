"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusIcon, Settings02Icon } from "@hugeicons/core-free-icons"
import { api, formatDateTime, withBranch, getBranches } from "@/lib/api"
import type { StockMovement, Product, Branch } from "@/lib/types"
import { useBranch } from "@/lib/branch-context"

export default function AdjustmentsPage() {
  const { branchParam } = useBranch()
  const [adjustments, setAdjustments] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ variantId: "", branchId: "", type: "increase", quantity: "", reason: "" })

  useEffect(() => {
    async function fetchData() {
      try {
        const [adjRes, prodRes, branchList] = await Promise.all([
          api.get(withBranch("/inventory/movements?type=adjustment", branchParam)),
          api.get(withBranch("/products", branchParam)),
          getBranches(),
        ])
        if (adjRes.success) setAdjustments(adjRes.data.movements || [])
        if (prodRes.success) setProducts(prodRes.data.products || [])
        setBranches(branchList)
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
    }))
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.variantId || !formData.branchId || !formData.quantity) {
      toast.error("Fill all required fields")
      return
    }
    setSaving(true)
    try {
      const res = await api.post("/inventory/adjustments", {
        variantId: formData.variantId,
        branchId: formData.branchId,
        type: formData.type,
        quantity: Number(formData.quantity),
        reason: formData.reason,
      })
      if (res.success) {
        toast.success("Stock adjusted!")
        setDialogOpen(false)
        setFormData({ variantId: "", branchId: "", type: "increase", quantity: "", reason: "" })
        const adjRes = await api.get("/inventory/movements?type=adjustment")
        if (adjRes.success) setAdjustments(adjRes.data.movements || [])
      } else {
        toast.error(res.message || "Failed to adjust stock")
      }
    } catch {
      toast.error("Failed to adjust stock")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Inventory", href: "/dashboard/inventory" },
      { label: "Adjustments" },
    ]}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground">Manual stock corrections and adjustments</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Adjustment</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
          <CardDescription>All stock adjustments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : adjustments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No adjustments recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.variant?.product?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.quantity > 0 ? "default" : "destructive"} className="capitalize">
                        {a.quantity > 0 ? "Increase" : "Decrease"}
                      </Badge>
                    </TableCell>
                    <TableCell className={a.quantity > 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                      {a.quantity > 0 ? "+" : ""}{a.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.previousQuantity}</TableCell>
                    <TableCell className="font-medium">{a.newQuantity}</TableCell>
                    <TableCell className="text-muted-foreground">{a.branch?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{a.note || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Stock Adjustment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Product Variant *</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.variantId} onChange={(e) => setFormData({ ...formData, variantId: e.target.value })} required>
                <option value="">Select product</option>
                {allVariants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Branch *</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} required>
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type *</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for adjustment..." rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Apply Adjustment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
