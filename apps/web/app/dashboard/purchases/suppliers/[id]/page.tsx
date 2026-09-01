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
import { ArrowLeft01Icon, Edit01Icon, PhoneIcon, MailIcon, MapPinIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate } from "@/lib/api"
import type { Supplier, Purchase } from "@/lib/types"

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [supRes, purRes] = await Promise.all([
          api.get(`/suppliers/${params.id}`),
          api.get(`/suppliers/${params.id}/purchases`),
        ])
        if (supRes.success) setSupplier(supRes.data.supplier)
        if (purRes.success) setPurchases(purRes.data.purchases || [])
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
      { label: "Suppliers", href: "/dashboard/purchases/suppliers" },
      { label: "Supplier Details" },
    ]}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
          </Button>
          {loading ? <Skeleton className="h-8 w-48" /> : (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{supplier?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={supplier?.active ? "default" : "secondary"}>{supplier?.active ? "Active" : "Inactive"}</Badge>
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
      ) : supplier ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
              <CardContent className="p-0">
                {purchases.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No purchases from this supplier yet</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO #</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-medium">{p.purchaseNo}</TableCell>
                          <TableCell className="text-muted-foreground">{p.branch?.name || "—"}</TableCell>
                          <TableCell className="font-medium">{formatTZS(p.totalAmount)}</TableCell>
                          <TableCell>{p.balance > 0 ? <span className="text-destructive">{formatTZS(p.balance)}</span> : <Badge variant="default">Paid</Badge>}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{p.status}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
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
              <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={PhoneIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={MailIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                    <span>{supplier.address}</span>
                  </div>
                )}
                <Separator />
                {supplier.contactPerson && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Person</span>
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Supplier not found</CardContent></Card>
      )}
    </DashboardLayout>
  )
}
