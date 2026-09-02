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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { RepeatIcon, Search01Icon, PlusIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatTZS, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { SubscriptionSale, Customer } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function SubscriptionSalePage() {
  const { branchParam } = useBranch()
  const [subscriptions, setSubscriptions] = useState<SubscriptionSale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerId: "", planName: "", amount: "", billingCycle: "monthly",
    startDate: new Date().toISOString().split("T")[0], autoRenew: "false",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, custRes] = await Promise.all([
          api.get(withBranch("/transactions/subscription-sale", branchParam)).catch(() => ({ success: false })),
          api.get(withBranch("/customers", branchParam)).catch(() => ({ success: false })),
        ])
        if (subRes.success) setSubscriptions(subRes.data.subscriptions || subRes.data.subscriptionSales || [])
        if (custRes.success) setCustomers(custRes.data.customers || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = s.subscriptionNumber?.toLowerCase().includes(q) || s.planName?.toLowerCase().includes(q) || s.customer?.name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customerId || !formData.planName || !formData.amount) { toast.error("Customer, plan name and amount are required"); return }
    setSaving(true)
    try {
      const res = await api.post("/transactions/subscription-sale", {
        customerId: formData.customerId,
        planName: formData.planName,
        amount: Number(formData.amount),
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        autoRenew: formData.autoRenew === "true",
      })
      if (res.success) {
        toast.success("Subscription created!")
        const refresh = await api.get(withBranch("/transactions/subscription-sale", branchParam))
        if (refresh.success) setSubscriptions(refresh.data.subscriptions || refresh.data.subscriptionSales || [])
        setSheetOpen(false)
        setFormData({ customerId: "", planName: "", amount: "", billingCycle: "monthly", startDate: new Date().toISOString().split("T")[0], autoRenew: "false" })
      } else toast.error(res.message || "Failed to create subscription")
    } catch { toast.error("Failed to create subscription") } finally { setSaving(false) }
  }

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Subscription Sales Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Sub #", "Customer", "Plan", "Amount", "Cycle", "Start Date", "Status"]],
      body: filtered.map((s) => [s.subscriptionNumber || "—", s.customer?.name || "—", s.planName, formatTZS(s.amount), s.billingCycle, formatDate(s.startDate), s.status]),
      theme: "striped", headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 12, right: 12 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  const totalAmount = filtered.reduce((sum, s) => sum + s.amount, 0)

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Subscription Sale" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Subscription Sales</h1><p className="text-sm text-muted-foreground">Manage recurring subscription sales</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
          <Button onClick={() => setSheetOpen(true)} className="gap-2"><HugeiconsIcon icon={PlusIcon} strokeWidth={2} className="size-4" /> New Subscription</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Subscriptions</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Amount</span><p className="text-2xl font-bold">{loading ? "—" : formatTZS(totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Active</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : filtered.filter(s => s.status === "active").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Subscriptions</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={RepeatIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No subscriptions found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Sub #</TableHead><TableHead>Customer</TableHead><TableHead>Plan</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Cycle</TableHead><TableHead>Start Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((s) => (<TableRow key={s.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{s.subscriptionNumber || "—"}</TableCell><TableCell className="font-medium">{s.customer?.name || "—"}</TableCell><TableCell>{s.planName}</TableCell><TableCell className="text-right">{formatTZS(s.amount)}</TableCell><TableCell className="capitalize">{s.billingCycle}</TableCell><TableCell className="text-muted-foreground">{formatDate(s.startDate)}</TableCell><TableCell><Badge variant={s.status === "active" ? "default" : s.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">{s.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto"><SheetHeader><SheetTitle>New Subscription</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2"><Label>Customer *</Label><Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Plan Name *</Label><Input value={formData.planName} onChange={(e) => setFormData({ ...formData, planName: e.target.value })} placeholder="e.g. Premium Monthly" required /></div>
            <div className="space-y-2"><Label>Amount (TZS) *</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Billing Cycle</Label><Select value={formData.billingCycle} onValueChange={(v) => setFormData({ ...formData, billingCycle: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Auto Renew</Label><Select value={formData.autoRenew} onValueChange={(v) => setFormData({ ...formData, autoRenew: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent></Select></div>
            <SheetFooter><Button type="submit" disabled={saving} className="w-full">{saving ? "Creating..." : "Create Subscription"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Subscription_Sales_${new Date().toISOString().split("T")[0]}.pdf`} title="Subscription Sales Report" />
    </DashboardLayout>
  )
}
