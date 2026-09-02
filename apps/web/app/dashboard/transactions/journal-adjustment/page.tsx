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
import { SlidersHorizontalIcon, Search01Icon, Download04Icon } from "@hugeicons/core-free-icons"
import { api, formatDate, withBranch } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import type { JournalAdjustment } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PdfPreviewModal } from "@/components/pdf-preview-modal"

export default function JournalAdjustmentPage() {
  const { branchParam } = useBranch()
  const [adjustments, setAdjustments] = useState<JournalAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(withBranch("/transactions/journal-adjustment", branchParam)).catch(() => ({ success: false }))
        if (res.success) setAdjustments(res.data.journalAdjustments || res.data.adjustments || [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [branchParam])

  const filtered = adjustments.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = a.adjustmentNumber?.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  function exportPDF() {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("Sinza Classic Wear", pw / 2, 20, { align: "center" })
    doc.setFontSize(14); doc.setFont("helvetica", "normal")
    doc.text("Journal Adjustments Report", pw / 2, 28, { align: "center" })
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, 35, { align: "center" })
    autoTable(doc, {
      startY: 44, head: [["Adj #", "Date", "Reason", "Debit", "Credit", "Status"]],
      body: filtered.map((a) => [a.adjustmentNumber || "—", formatDate(a.date), a.reason?.slice(0, 30) || "—", a.totalDebit.toFixed(2), a.totalCredit.toFixed(2), a.status]),
      theme: "striped", headStyles: { fillColor: [147, 51, 234], textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    })
    setPdfDoc(doc); setPdfOpen(true)
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/dashboard/transactions" }, { label: "Journal Adjustment" }]}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Journal Adjustments</h1><p className="text-sm text-muted-foreground">View and manage journal entry adjustments</p></div>
        <Button variant="outline" onClick={exportPDF} disabled={loading || filtered.length === 0} className="gap-2"><HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" /> Export</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Adjustments</span><p className="text-2xl font-bold">{loading ? "—" : filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Total Debit</span><p className="text-2xl font-bold">{loading ? "—" : filtered.reduce((s, a) => s + a.totalDebit, 0).toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><span className="text-sm text-muted-foreground">Approved</span><p className="text-2xl font-bold text-emerald-600">{loading ? "—" : filtered.filter(a => a.status === "approved").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Journal Adjustments</CardTitle><CardDescription>{filtered.length} records</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
              <div className="relative w-full sm:w-40"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
           filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><HugeiconsIcon icon={SlidersHorizontalIcon} strokeWidth={2} className="size-10 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No journal adjustments found</p></div> :
           <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Adj #</TableHead><TableHead>Date</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
             <TableBody>{filtered.map((a) => (<TableRow key={a.id} className="hover:bg-muted/50"><TableCell className="font-mono text-xs">{a.adjustmentNumber || "—"}</TableCell><TableCell className="text-muted-foreground">{formatDate(a.date)}</TableCell><TableCell>{a.reason}</TableCell><TableCell className="text-right">{a.totalDebit.toFixed(0)}</TableCell><TableCell className="text-right">{a.totalCredit.toFixed(0)}</TableCell><TableCell><Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{a.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <PdfPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)} doc={pdfDoc} filename={`Journal_Adjustments_${new Date().toISOString().split("T")[0]}.pdf`} title="Journal Adjustments Report" />
    </DashboardLayout>
  )
}
