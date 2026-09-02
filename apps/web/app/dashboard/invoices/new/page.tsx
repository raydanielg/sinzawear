"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileAddIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { api, formatTZS, withBranch } from "@/lib/api"
import type { Customer, Product } from "@/lib/types"
import { useBranch } from "@/lib/branch-context"
import Link from "next/link"

interface LineItem {
  variantId: string
  description: string
  quantity: number
  rate: number
  amount: number
  taxRate: number
  taxAmount: number
  taxType: "INCL" | "EXCL"
  rateType: "whole" | "retail"
}

interface Attachment {
  title: string
  filename: string
}

export default function NewInvoicePage() {
  const { branchParam } = useBranch()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Due Upon Receipt")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0])
  const [memo, setMemo] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [project, setProject] = useState("New project")
  const [saleCirculation, setSaleCirculation] = useState("")
  const [salePerson, setSalePerson] = useState("")
  const [stationLocation, setStationLocation] = useState("")
  const [partialPayment, setPartialPayment] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState("deposit")
  const [paymentNote, setPaymentNote] = useState("")
  const [discountAmount, setDiscountAmount] = useState("0")
  const [discountPercent, setDiscountPercent] = useState("0")
  const [items, setItems] = useState<LineItem[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([{ title: "", filename: "" }])
  const [invoiceNumber, setInvoiceNumber] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get("/customers"),
          api.get(withBranch("/products", branchParam)),
        ])
        if (custRes.success) setCustomers(custRes.data.customers || [])
        if (prodRes.success) setProducts(prodRes.data.products || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [branchParam])

  useEffect(() => {
    const yy = String(new Date().getFullYear()).slice(2)
    const mm = String(new Date().getMonth() + 1).padStart(2, "0")
    const ts = Date.now().toString()
    setInvoiceNumber(`INV/${yy}/${mm}/${ts}`)
  }, [])

  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      id: v.id,
      label: `${p.name} - ${v.sku} (${v.color?.name || ""} / ${v.size?.name || ""})`,
      sku: v.sku,
      productName: p.name,
      sellingPrice: v.sellingPrice,
      costPrice: v.costPrice,
    }))
  )

  function addItem() {
    setItems([...items, {
      variantId: "", description: "", quantity: 1, rate: 0, amount: 0,
      taxRate: 0, taxAmount: 0, taxType: "EXCL", rateType: "retail",
    }])
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items]
    const current = updated[index]
    if (!current) return
    const item: LineItem = { ...current, [field]: value }

    if (field === "variantId") {
      const variant = allVariants.find((v) => v.id === value)
      if (variant) {
        item.description = variant.productName
        item.rate = variant.sellingPrice
      }
    }

    if (field === "rateType" || field === "variantId") {
      const variant = allVariants.find((v) => v.id === item.variantId)
      if (variant && item.rateType === "retail") {
        item.rate = variant.sellingPrice
      }
    }

    const qty = item.quantity
    const rate = item.rate
    const lineAmount = qty * rate

    if (item.taxType === "INCL") {
      const netAmount = lineAmount / (1 + item.taxRate / 100)
      item.taxAmount = lineAmount - netAmount
      item.amount = netAmount
    } else {
      item.taxAmount = lineAmount * (item.taxRate / 100)
      item.amount = lineAmount
    }

    updated[index] = item
    setItems(updated)
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0)
  const totalBeforeDiscount = subtotal + totalTax
  const discAmt = Number(discountAmount) || 0
  const discPct = Number(discountPercent) || 0
  const calculatedDiscount = discAmt > 0 ? discAmt : (totalBeforeDiscount * discPct / 100)
  const totalAfterDiscount = totalBeforeDiscount - calculatedDiscount
  const partial = Number(partialPayment) || 0
  const balance = totalAfterDiscount - partial

  function addAttachment() {
    setAttachments([...attachments, { title: "", filename: "" }])
  }

  function updateAttachment(index: number, field: keyof Attachment, value: string) {
    const updated = [...attachments]
    updated[index] = { ...updated[index], [field]: value }
    setAttachments(updated)
  }

  function removeAttachment(index: number) {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { toast.error("Please select a client"); return }
    if (items.length === 0) { toast.error("Please add at least one line item"); return }
    setSaving(true)
    try {
      const res = await api.post("/invoices", {
        customerId,
        paymentTerms,
        invoiceDate,
        dueDate: dueDate || undefined,
        memo: memo || undefined,
        deliveryDate: deliveryDate || undefined,
        project: project || undefined,
        saleCirculation: saleCirculation || undefined,
        salePerson: salePerson || undefined,
        stationLocation: stationLocation || undefined,
        partialPayment: Number(partialPayment) || 0,
        paymentMethod,
        paymentNote: paymentNote || undefined,
        discountAmount: Number(discountAmount) || 0,
        discountPercent: Number(discountPercent) || 0,
        attachments: attachments.filter((a) => a.title || a.filename),
        items: items.map((i) => ({
          variantId: i.variantId || undefined,
          description: i.description || undefined,
          quantity: i.quantity,
          rate: i.rate,
          taxRate: i.taxRate,
          taxType: i.taxType,
          rateType: i.rateType,
        })),
      })
      if (res.success) {
        toast.success("Invoice created successfully!")
        window.location.href = "/dashboard/invoices"
      } else {
        toast.error(res.message || "Failed to create invoice")
      }
    } catch {
      toast.error("Failed to create invoice")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Invoices", href: "/dashboard/invoices" }, { label: "New" }]}>
        <Skeleton className="h-96 w-full rounded-xl" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Invoices", href: "/dashboard/invoices" }, { label: "New Invoice" }]}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Create a new invoice for a client</p>
        </div>
        <Link href="/dashboard/invoices">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} className="size-4" /> Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>General Information - Tsh</CardTitle>
            <CardDescription>Client and invoice details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice No.</Label>
              <Input value={invoiceNumber} readOnly className="font-mono text-sm bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={(v) => setPaymentTerms(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Due Upon Receipt">Due Upon Receipt</SelectItem>
                  <SelectItem value="Net 7">Net 7</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Date *</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Memo</Label>
              <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Optional memo" />
            </div>

            <div className="space-y-2">
              <Label>Delivery Date</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" />
            </div>

            <div className="space-y-2">
              <Label>Sale Circulation</Label>
              <Select value={saleCirculation} onValueChange={(v) => setSaleCirculation(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Choose Sale Agent from Circulation/Distribution" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent_1">Agent 1</SelectItem>
                  <SelectItem value="agent_2">Agent 2</SelectItem>
                  <SelectItem value="distribution">Distribution Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sale Person</Label>
              <Input value={salePerson} onChange={(e) => setSalePerson(e.target.value)} placeholder="Sale Representative for this sale" />
            </div>

            <div className="space-y-2">
              <Label>Station Location</Label>
              <Input value={stationLocation} onChange={(e) => setStationLocation(e.target.value)} placeholder="Station location" />
            </div>

            <div className="space-y-2">
              <Label>Partial Payment</Label>
              <Input type="number" min="0" value={partialPayment} onChange={(e) => setPartialPayment(e.target.value)} placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Product & Service Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product &amp; Service Details</CardTitle>
                <CardDescription>Add products and services to the invoice</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No items added yet. Click "Add Item" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 sm:col-span-4 space-y-1">
                        <Label className="text-xs">Product/Service</Label>
                        <Select value={item.variantId} onValueChange={(v) => updateItem(index, "variantId", v ?? "")}>
                          <SelectTrigger><SelectValue placeholder="Choose product/service" /></SelectTrigger>
                          <SelectContent>
                            {allVariants.map((v) => (
                              <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-12 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="What did you pay for" />
                      </div>
                      <div className="col-span-4 sm:col-span-1 space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} />
                      </div>
                      <div className="col-span-4 sm:col-span-1 space-y-1">
                        <Label className="text-xs">Rate</Label>
                        <Input type="number" min="0" value={item.rate} onChange={(e) => updateItem(index, "rate", Number(e.target.value))} />
                      </div>
                      <div className="col-span-3 sm:col-span-2 space-y-1">
                        <Label className="text-xs">Amount</Label>
                        <div className="text-sm font-medium py-2">{formatTZS(item.amount)}</div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-end pl-1">
                      <div className="col-span-6 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Rate Type</Label>
                        <Select value={item.rateType} onValueChange={(v) => updateItem(index, "rateType", v ?? "retail")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="whole">Whole</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-6 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Tax Type</Label>
                        <Select value={item.taxType} onValueChange={(v) => updateItem(index, "taxType", v ?? "EXCL")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EXCL">EXCL</SelectItem>
                            <SelectItem value="INCL">INCL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-6 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Tax Rate (%)</Label>
                        <Select value={String(item.taxRate)} onValueChange={(v) => updateItem(index, "taxRate", Number(v))}>
                          <SelectTrigger><SelectValue placeholder="Choose Tax" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (No Tax)</SelectItem>
                            <SelectItem value="18">18% (VAT)</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-6 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Tax Amount</Label>
                        <div className="text-sm py-2">{formatTZS(item.taxAmount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-6 border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span className="font-medium">{formatTZS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatTZS(totalTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{formatTZS(totalBeforeDiscount)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground whitespace-nowrap">Discount Amount: Tsh</span>
                  <Input type="number" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="h-8 w-28" />
                  <span className="text-muted-foreground">%</span>
                  <Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="h-8 w-20" />
                  <span className="font-medium ml-auto">{formatTZS(calculatedDiscount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total After Discount</span>
                  <span>{formatTZS(totalAfterDiscount)}</span>
                </div>
                {partial > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance (After Partial Payment)</span>
                    <span className="font-medium text-emerald-600">{formatTZS(balance)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attachment(s)</CardTitle>
                <CardDescription>Add file references (MaxSize: 1MB)</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addAttachment} className="gap-2">
                <HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {attachments.map((att, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={att.title} onChange={(e) => updateAttachment(index, "title", e.target.value)} placeholder="Attachment title" />
                </div>
                <div className="col-span-10 sm:col-span-7 space-y-1">
                  <Label className="text-xs">Choose file (MaxSize: 1MB)</Label>
                  <Input value={att.filename} onChange={(e) => updateAttachment(index, "filename", e.target.value)} placeholder="No file chosen" />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  {attachments.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                      <HugeiconsIcon icon={TrashIcon} strokeWidth={2} className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Note */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Note</CardTitle>
            <CardDescription>Bank and mobile money payment instructions</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder={"NMB\n\nNEXTBYTE ICT SOLUTION : 61488219509\n\nM-PESA\n\nNEXTBYTE : 0743491697"}
              rows={6}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link href="/dashboard/invoices"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} className="size-4" />
            {saving ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
