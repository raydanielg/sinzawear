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
import { PrinterIcon, DownloadIcon, ReturnRequestIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime } from "@/lib/api"
import type { Sale } from "@/lib/types"

export default function SaleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSale() {
      try {
        const res = await api.get(`/sales/${params.id}`)
        if (res.success) setSale(res.data.sale)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSale()
  }, [params.id])

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sales", href: "/dashboard/sales" },
      { label: "Sale Details" },
    ]}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
          </Button>
          <div>
            {loading ? <Skeleton className="h-8 w-40" /> : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">Sale #{sale?.saleNumber}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={sale?.status === "paid" || sale?.status === "completed" ? "default" : "secondary"} className="capitalize">{sale?.status}</Badge>
                  <span className="text-sm text-muted-foreground">{sale ? formatDateTime(sale.createdAt) : ""}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" /> Print Receipt</Button>
          <Button variant="outline"><HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="size-4" /> Download PDF</Button>
          <Button variant="destructive"><HugeiconsIcon icon={ReturnRequestIcon} strokeWidth={2} className="size-4" /> Return</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : sale ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.variant?.product?.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.variant?.color?.name} / {item.variant?.size?.name}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatTZS(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatTZS(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {sale.payments?.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <Badge variant="outline" className="capitalize">{p.method}</Badge>
                      <span className="font-medium">{formatTZS(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                {sale.customer ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{sale.customer.name}</span>
                    {sale.customer.phone && <span className="text-sm text-muted-foreground">{sale.customer.phone}</span>}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Walk-in customer</span>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatTZS(sale.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatTZS(sale.discount)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold">{formatTZS(sale.total)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-primary">{formatTZS(sale.payments?.reduce((s, p) => s + p.amount, 0) || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch</span>
                  <span>{sale.branch?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier</span>
                  <span>{sale.cashier?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDateTime(sale.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Sale not found</CardContent></Card>
      )}
    </DashboardLayout>
  )
}
