"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusIcon, PackageReceiveIcon, PhoneIcon, MapIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"

interface Supplier {
  id: string
  name: string
  phone: string
  email: string
  address: string
  tin: string
  totalPurchases: number
  totalPaid: number
  balance: number
  _count?: { purchases: number }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await api.get("/purchases/suppliers")
        if (res.success) setSuppliers(res.data.suppliers || [])
      } catch {
        // API not connected
      } finally {
        setLoading(false)
      }
    }
    fetchSuppliers()
  }, [])

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Purchasing", href: "/dashboard/purchases" }, { label: "Suppliers" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage your suppliers and track balances</p>
        </div>
        <Button>
          <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" />
          Add Supplier
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
            <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No suppliers yet</p>
              <p className="text-sm text-muted-foreground">Add suppliers to start purchasing stock</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} className="size-5" />
                    </div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                  {s.balance > 0 && <Badge variant="destructive">Owes {formatTZS(s.balance)}</Badge>}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {s.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={PhoneIcon} strokeWidth={2} className="size-4" />
                      {s.phone}
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={MapIcon} strokeWidth={2} className="size-4" />
                      {s.address}
                    </div>
                  )}
                  {s.tin && <div className="text-muted-foreground">TIN: {s.tin}</div>}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-sm font-medium">{formatTZS(s.totalPurchases)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                    <div className="text-sm font-medium">{formatTZS(s.totalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Orders</div>
                    <div className="text-sm font-medium">{s._count?.purchases || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
