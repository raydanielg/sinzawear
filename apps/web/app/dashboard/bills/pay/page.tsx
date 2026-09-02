"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CoinsIcon, ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import Link from "next/link"

interface Bill {
  id: string
  purchaseNumber: string
  totalAmount: number
  paidAmount: number
  balance: number
  status: string
  createdAt: string
  supplier?: { name: string }
}

export default function PayBillsPage() {
  const { branchParam } = useBranch()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("cash")
  const [reference, setReference] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/purchases", branchParam))
        if (res.success) {
          const unpaid = (res.data.purchases || []).filter((p: Bill) => p.balance > 0)
          setBills(unpaid)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBill) { toast.error("Select a bill to pay"); return }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return }
    setSaving(true)
    try {
      const res = await api.post(`/purchases/${selectedBill.id}/payments`, {
        amount: Number(amount),
        method,
        reference: reference || undefined,
        paymentDate,
      })
      if (res.success) {
        toast.success("Payment recorded successfully!")
        setSelectedBill(null)
        setAmount("")
        setReference("")
        const refresh = await api.get(withBranch("/purchases", branchParam))
        if (refresh.success) {
          setBills((refresh.data.purchases || []).filter((p: Bill) => p.balance > 0))
        }
      } else {
        toast.error(res.message || "Failed to record payment")
      }
    } catch {
      toast.error("Failed to record payment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pay Bills" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pay Bills</h1>
          <p className="text-sm text-muted-foreground">Record payments to suppliers for outstanding bills</p>
        </div>
        <Link href="/dashboard/purchases">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} className="size-4" /> Back to Purchases
          </Button>
        </Link>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            No outstanding bills. All supplier payments are settled.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Outstanding Bills</CardTitle>
              <CardDescription>Select a bill to record a payment</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((b) => (
                    <TableRow key={b.id} className={selectedBill?.id === b.id ? "bg-muted" : ""}>
                      <TableCell className="font-medium">{b.purchaseNumber}</TableCell>
                      <TableCell>{b.supplier?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(b.createdAt)}</TableCell>
                      <TableCell className="text-right">{formatTZS(b.totalAmount)}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">{formatTZS(b.balance)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedBill(b); setAmount(String(b.balance)) }}>
                          Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedBill && (
            <Card>
              <CardHeader>
                <CardTitle>Record Payment</CardTitle>
                <CardDescription>{selectedBill.purchaseNumber} - {selectedBill.supplier?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-3 space-y-1 text-sm bg-muted/30 mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{formatTZS(selectedBill.totalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium">{formatTZS(selectedBill.paidAmount)}</span></div>
                  <div className="flex justify-between border-t pt-1"><span className="font-medium">Balance</span><span className="font-bold text-destructive">{formatTZS(selectedBill.balance)}</span></div>
                </div>
                <form onSubmit={handlePay} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Method *</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Date *</Label>
                    <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference" />
                  </div>
                  <Button type="submit" disabled={saving} className="w-full gap-2">
                    <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-4" />
                    {saving ? "Recording..." : "Record Payment"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
