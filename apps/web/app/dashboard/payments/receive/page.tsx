"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cash01Icon, ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import Link from "next/link"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  paidAmount: number
  balance: number
  customer?: { name: string }
}

export default function ReceivePaymentPage() {
  const { branchParam } = useBranch()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [invoiceId, setInvoiceId] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("cash")
  const [reference, setReference] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/invoices?status=unpaid,partial")
        if (res.success) setInvoices(res.data.invoices || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoiceId) { toast.error("Please select an invoice"); return }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return }
    setSaving(true)
    try {
      const res = await api.post(`/invoices/${invoiceId}/payments`, {
        amount: Number(amount),
        method,
        reference: reference || undefined,
        paymentDate,
      })
      if (res.success) {
        toast.success("Payment received successfully!")
        setInvoiceId("")
        setAmount("")
        setReference("")
      } else {
        toast.error(res.message || "Failed to record payment")
      }
    } catch {
      toast.error("Failed to record payment")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Receive Payment" }]}>
        <Skeleton className="h-96 w-full rounded-xl" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Receive Payment" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receive Payment</h1>
          <p className="text-sm text-muted-foreground">Record a payment for an invoice</p>
        </div>
        <Link href="/dashboard/invoices">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} className="size-4" /> Back to Invoices
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Select an unpaid invoice and record the payment</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              No unpaid invoices found. All invoices are fully paid.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice *</Label>
                <Select value={invoiceId} onValueChange={setInvoiceId}>
                  <SelectTrigger><SelectValue placeholder="Select unpaid invoice" /></SelectTrigger>
                  <SelectContent>
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.customer?.name || "Unknown"} (Balance: {formatTZS(inv.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedInvoice && (
                <div className="rounded-lg border p-4 space-y-1 text-sm bg-muted/30">
                  <div className="flex justify-between"><span className="text-muted-foreground">Invoice Total</span><span className="font-medium">{formatTZS(selectedInvoice.total)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid Amount</span><span className="font-medium">{formatTZS(selectedInvoice.paidAmount)}</span></div>
                  <div className="flex justify-between border-t pt-1"><span className="font-medium">Outstanding Balance</span><span className="font-bold">{formatTZS(selectedInvoice.balance)}</span></div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" required />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
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
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference (optional)" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Link href="/dashboard/invoices"><Button type="button" variant="outline">Cancel</Button></Link>
                <Button type="submit" disabled={saving} className="gap-2">
                  <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} className="size-4" />
                  {saving ? "Recording..." : "Receive Payment"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
