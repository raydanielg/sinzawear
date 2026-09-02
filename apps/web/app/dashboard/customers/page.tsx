"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, PlusIcon, UsersIcon, EyeIcon, Edit02Icon, TrashIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate } from "@/lib/api"
import type { Customer } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" })

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`)
        if (res.success) setCustomers(res.data.customers || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(fetchCustomers, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search])

  function openAdd() {
    setEditingCustomer(null)
    setFormData({ name: "", phone: "", email: "", address: "" })
    setDialogOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer)
    setFormData({ name: customer.name, phone: customer.phone || "", email: customer.email || "", address: customer.address || "" })
    setDialogOpen(true)
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) { toast.error("Customer name is required"); return }
    setSaving(true)
    try {
      let res
      if (editingCustomer) {
        res = await api.put(`/customers/${editingCustomer.id}`, formData)
      } else {
        res = await api.post("/customers", formData)
      }
      if (res.success) {
        toast.success(editingCustomer ? "Customer updated!" : "Customer added!")
        setDialogOpen(false)
        setFormData({ name: "", phone: "", email: "", address: "" })
        const refresh = await api.get("/customers")
        if (refresh.success) setCustomers(refresh.data.customers || [])
      } else {
        toast.error(res.message || "Failed to save customer")
      }
    } catch {
      toast.error("Failed to save customer")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) return
    try {
      const res = await api.delete(`/customers/${customer.id}`)
      if (res.success) {
        toast.success("Customer deleted")
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
      } else {
        toast.error(res.message || "Failed to delete customer")
      }
    } catch {
      toast.error("Failed to delete customer")
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Customers" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer profiles and loyalty</p>
        </div>
        <Button onClick={openAdd}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Customer</Button>
      </div>

      <div className="relative w-full max-w-sm">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>{loading ? "Loading..." : `${customers.length} customers`}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <HugeiconsIcon icon={UsersIcon} strokeWidth={2} className="size-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No customers yet</p>
                <p className="text-sm text-muted-foreground">Customers will appear here after sales</p>
              </div>
              <Button size="sm" onClick={openAdd}><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Customer</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                    <TableCell className="font-medium">{formatTZS(c.totalPurchases)}</TableCell>
                    <TableCell>{c._count?.sales || 0}</TableCell>
                    <TableCell><Badge variant="secondary">{c.loyaltyPoints} pts</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/customers/${c.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View Details"><HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" /></Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button size="sm" variant="ghost" className="h-8 w-8 p-0" />}>
                            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" /> Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c)}>
                              <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleAddCustomer} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Customer name" required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Address" />
            </div>
            </div>
            <SheetFooter className="border-t">
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingCustomer ? "Save Changes" : "Add Customer"}</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
