"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings05Icon, Edit02Icon, Search01Icon, BuildingIcon, UsersIcon,
  CoinsIcon, UserGroupIcon, CalendarIcon, CreditCardIcon, File02Icon,
  ShieldCheckIcon, Image02Icon, StarAwardIcon, Book01Icon, Wallet01Icon,
  Package02Icon, Cash01Icon, ChartIcon, LockIcon,
} from "@hugeicons/core-free-icons"
import { api } from "@/lib/api"

interface SysDefItem {
  id: string
  label: string
  value: string
  valueType: "yes_no" | "text" | "select"
  options?: string[]
  badge?: "success" | "warning" | "default"
  extendedToStation?: boolean
}

interface SysDefCategory {
  id: string
  name: string
  items: SysDefItem[]
}

const settingTabs = [
  { label: "System Definitions", icon: Settings05Icon, active: true },
  { label: "Manage Organization", icon: BuildingIcon },
  { label: "Manage Stations/Branches", icon: BuildingIcon, href: "/dashboard/branches" },
  { label: "Manage Currency", icon: CoinsIcon },
  { label: "Manage Users", icon: UsersIcon, href: "/dashboard/users" },
  { label: "Roles & Permissions", icon: ShieldCheckIcon, href: "/dashboard/settings/roles" },
  { label: "Manage Designation", icon: UserGroupIcon },
  { label: "Manage Department/Units", icon: UserGroupIcon, href: "/dashboard/hr/departments" },
  { label: "Code Values", icon: File02Icon },
  { label: "Holidays", icon: CalendarIcon },
  { label: "Payment Methods", icon: CreditCardIcon },
  { label: "Payment Terms", icon: File02Icon },
  { label: "Country", icon: BuildingIcon },
  { label: "Workflow Allocation", icon: ChartIcon },
  { label: "Manage Financial Year", icon: CalendarIcon },
  { label: "Audit Logs", icon: File02Icon, href: "/dashboard/audit-logs" },
  { label: "Table Custom Settings", icon: Settings05Icon },
  { label: "Support Center", icon: StarAwardIcon },
  { label: "Manage System Jobs", icon: Settings05Icon },
]

const systemCategories: SysDefCategory[] = [
  {
    id: "accounting",
    name: "Accounting",
    items: [
      { id: "1", label: "Activate Bank Reconciliation", value: "yes", valueType: "yes_no", badge: "success" },
      { id: "2", label: "Chart of Accounts: Display account no with name on Dropdown options (On Different transaction processes)", value: "no", valueType: "yes_no", badge: "warning" },
      { id: "3", label: "Chart Of Accounts: Sort column in ascending order i.e. account_no, name, account_group_name", value: "", valueType: "text" },
      { id: "4", label: "Daily Closing Reports: Show fund transfers separately on Cash overall summary section", value: "no", valueType: "yes_no", badge: "warning" },
      { id: "5", label: "Default Financial Report Basis i.e. 1 => Cash, 2 => Accrual", value: "Accrual", valueType: "text" },
      { id: "6", label: "Fund Transfer: Allow only station accounts", value: "no", valueType: "yes_no", badge: "warning", extendedToStation: true },
      { id: "7", label: "Inventory: Valuation Method", value: "FIFO", valueType: "text" },
      { id: "8", label: "Multi-Currency: Auto update exchange rate based on recent transaction", value: "yes", valueType: "yes_no", badge: "success" },
      { id: "9", label: "Track Account Expiry period for next renewal e.g. Expenses (Rent/License)", value: "yes", valueType: "yes_no", badge: "success" },
      { id: "10", label: "Track Contact: Centralize Contact from All stations on Journal and Expense", value: "no", valueType: "yes_no", badge: "warning" },
      { id: "11", label: "Track Contact: Validate Contact Account Balance if is enough for transaction", value: "yes", valueType: "yes_no", badge: "success" },
      { id: "12", label: "Track Transactions and Balance for contact on specified account (COA)", value: "yes", valueType: "yes_no", badge: "success" },
      { id: "13", label: "Transaction Close Date (Close the books)", value: "31-Dec-2025", valueType: "text" },
    ],
  },
  {
    id: "budgeting",
    name: "Budgeting",
    items: [],
  },
]

const categoryButtons = [
  { id: "accounting", label: "Accounting", icon: Book01Icon },
  { id: "expense", label: "Expense", icon: Wallet01Icon },
  { id: "hr", label: "Human Resource (HR)", icon: UserGroupIcon },
  { id: "product", label: "Product & Service", icon: Package02Icon },
  { id: "sales", label: "Sales", icon: Cash01Icon },
  { id: "advanced", label: "System: Advanced Settings", icon: Settings05Icon },
  { id: "features", label: "System: Features Activation", icon: StarAwardIcon },
  { id: "images", label: "System: Images & Logos", icon: Image02Icon },
  { id: "security", label: "System: Security Settings", icon: LockIcon },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("System Definitions")
  const [activeCategory, setActiveCategory] = useState("accounting")
  const [search, setSearch] = useState("")
  const [editItem, setEditItem] = useState<SysDefItem | null>(null)
  const [editValue, setEditValue] = useState("")
  const [business, setBusiness] = useState({ name: "", phone: "", email: "", address: "" })
  const [system, setSystem] = useState({ currency: "TZS", receiptPrefix: "SF", invoicePrefix: "INV", lowStockThreshold: "10", taxRate: "0", loyaltyRate: "1" })
  const [categories, setCategories] = useState<SysDefCategory[]>(systemCategories)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get("/settings")
        if (res.success && res.data) {
          if (res.data.business) setBusiness(res.data.business)
          if (res.data.system) setSystem(res.data.system)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put("/settings/business", business)
      if (res.success) toast.success("Business settings saved!")
      else toast.error(res.message || "Failed to save")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSystem(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put("/settings/system", {
        ...system,
        lowStockThreshold: Number(system.lowStockThreshold),
        taxRate: Number(system.taxRate),
        loyaltyRate: Number(system.loyaltyRate),
      })
      if (res.success) toast.success("System settings saved!")
      else toast.error(res.message || "Failed to save")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  function openEdit(item: SysDefItem) {
    setEditItem(item)
    setEditValue(item.value)
  }

  function handleSaveEdit() {
    if (!editItem) return
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === editItem.id ? { ...item, value: editValue } : item
        ),
      }))
    )
    toast.success("Setting updated!")
    setEditItem(null)
  }

  function renderValue(item: SysDefItem) {
    if (item.valueType === "yes_no") {
      const isYes = item.value === "yes"
      return (
        <Badge variant={isYes ? "default" : "secondary"} className={isYes ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}>
          {isYes ? "Yes" : "No"}
        </Badge>
      )
    }
    if (!item.value) {
      return <span className="text-xs text-muted-foreground">—</span>
    }
    return <span className="text-sm text-muted-foreground">{item.value}</span>
  }

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0]
  const filteredItems = currentCategory.items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 col-span-2 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your business and system settings</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Left Vertical Tabs */}
        <div className="w-full lg:w-56 shrink-0">
          <div className="flex flex-col gap-0.5 rounded-lg border bg-card p-2">
            {settingTabs.map((tab) => {
              const isActive = activeTab === tab.label
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTab(tab.label)
                    if (tab.href && tab.href !== "/dashboard/settings") {
                      window.location.href = tab.href
                    }
                  }}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.icon && <HugeiconsIcon icon={tab.icon} strokeWidth={2} className="size-4 shrink-0" />}
                  <span className="leading-tight">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-4">
          {activeTab === "System Definitions" ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Category Side Nav */}
              <div className="flex flex-wrap gap-1 sm:w-44 sm:shrink-0 sm:flex-col">
                {categoryButtons.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium transition-colors w-full ${
                      activeCategory === cat.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {cat.icon && <HugeiconsIcon icon={cat.icon} strokeWidth={2} className="size-3.5 shrink-0" />}
                    <span className="leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Settings Content */}
              <div className="flex-1">
                <Card>
                  <CardContent className="p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-bold">{currentCategory.name}</h3>
                      <div className="relative w-full sm:w-64">
                        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search Setting..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="h-9 pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">No settings found</div>
                      ) : (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-snug">{item.label}</p>
                              {item.extendedToStation && (
                                <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">
                                  Extended to Station
                                </Badge>
                              )}
                            </div>
                            <div className="w-32 text-center">{renderValue(item)}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEdit(item)}
                            >
                              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>General business details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveBusiness} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} placeholder="Sinza Fashion" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="+255 700 000 000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} placeholder="info@sinza.co.tz" />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} placeholder="Dar es Salaam, Tanzania" rows={2} />
                    </div>
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Receipts, currency, and thresholds</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSystem} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input value={system.currency} onChange={(e) => setSystem({ ...system, currency: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Receipt Prefix</Label>
                        <Input value={system.receiptPrefix} onChange={(e) => setSystem({ ...system, receiptPrefix: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Invoice Prefix</Label>
                        <Input value={system.invoicePrefix} onChange={(e) => setSystem({ ...system, invoicePrefix: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Low Stock Threshold</Label>
                        <Input type="number" value={system.lowStockThreshold} onChange={(e) => setSystem({ ...system, lowStockThreshold: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input type="number" value={system.taxRate} onChange={(e) => setSystem({ ...system, taxRate: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Loyalty Points Rate (per TZS spent)</Label>
                      <Input type="number" value={system.loyaltyRate} onChange={(e) => setSystem({ ...system, loyaltyRate: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit System Definition Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit System Definition</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{editItem.label}</Label>
                {editItem.valueType === "yes_no" ? (
                  <Select value={editValue} onValueChange={(v) => setEditValue(v ?? "no")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
