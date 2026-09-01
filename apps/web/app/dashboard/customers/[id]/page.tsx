"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Separator } from "@workspace/ui/components/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Edit01Icon, PhoneIcon, MailIcon, MapPinIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDateTime } from "@/lib/api"
import type { Customer, Sale } from "@/lib/types"

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, salesRes] = await Promise.all([
          api.get(`/customers/${params.id}`),
          api.get(`/customers/${params.id}/sales`),
        ])
        if (custRes.success) setCustomer(custRes.data.customer)
        if (salesRes.success) setSales(salesRes.data.sales || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  return (
    <DashboardLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Customers", href: "/dashboard/customers" },
      { label: "Customer Details" },
    ]}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
          </Button>
          {loading ? <Skeleton className="h-8 w-48" /> : (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{customer?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary">{customer?.loyaltyPoints} loyalty points</Badge>
              </div>
            </div>
          )}
        </div>
        <Button variant="outline"><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" /> Edit</Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : customer ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
              <CardContent className="p-0">
                {sales.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No purchases yet</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs font-medium">{s.saleNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{s.items?.length || 0}</TableCell>
                          <TableCell className="font-medium">{formatTZS(s.total)}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{s.status}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(s.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={PhoneIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={MailIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Purchases</span>
                  <span className="font-medium">{formatTZS(customer.totalPurchases)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">{sales.length}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loyalty Points</span>
                  <Badge variant="secondary">{customer.loyaltyPoints} pts</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Customer not found</CardContent></Card>
      )}
    </DashboardLayout>
  )
}
