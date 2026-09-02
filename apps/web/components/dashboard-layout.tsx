"use client"

import { AppSidebar } from "@workspace/ui/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Toaster } from "@workspace/ui/components/sonner"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Notification03Icon,
  Store02Icon,
  UserCircleIcon,
  Logout01Icon,
  Settings05Icon,
  FlashIcon,
  File02Icon,
  FileAddIcon,
  Cash01Icon,
  ReceiptIcon,
  UsersIcon,
  UserGroupIcon,
  PackageReceiveIcon,
  CoinsIcon,
  TruckIcon,
  ShoppingBag01Icon,
  ChartIcon,
  Calendar03Icon,
  Wallet01Icon,
  Book01Icon,
  ArrowDataTransferHorizontalIcon,
  BanknoteIcon,
  ArrowLeftRightIcon,
  Sun02Icon,
  Moon02Icon,
} from "@hugeicons/core-free-icons"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api, getUser, clearAuth } from "@/lib/api"
import { useBranch } from "@/lib/branch-context"
import { useTheme } from "next-themes"

interface DashboardLayoutProps {
  children: React.ReactNode
  breadcrumbs: { label: string; href?: string }[]
}

function DashboardInner({ children, breadcrumbs }: DashboardLayoutProps) {
  const router = useRouter()
  const { selectedBranch, setSelectedBranch, branches } = useBranch()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  const [user, setUser] = useState<{ name: string; email: string; roles?: string[] } | null>(null)
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; isRead: boolean }[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ products: any[]; customers: any[] }>({ products: [], customers: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({ products: [], customers: [] }); return }
    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          api.get(`/products?search=${encodeURIComponent(searchQuery)}`),
          api.get(`/customers?search=${encodeURIComponent(searchQuery)}`),
        ])
        setSearchResults({
          products: prodRes.success ? (prodRes.data.products || []).slice(0, 4) : [],
          customers: custRes.success ? (custRes.data.customers || []).slice(0, 4) : [],
        })
      } catch { setSearchResults({ products: [], customers: [] }) }
      finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const u = getUser()
    if (u) setUser(u)
    async function fetchNotifs() {
      try {
        const notifRes = await api.get("/notifications")
        if (notifRes.success) setNotifications(notifRes.data.notifications || [])
      } catch {}
    }
    fetchNotifs()
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleLogout = () => {
    clearAuth()
    router.push("/auth")
  }

  return (
    <SidebarProvider>
      <AppSidebar
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-1 sm:gap-2 border-b px-2 sm:px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 data-vertical:h-4 data-vertical:self-auto" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem className={i === 0 ? "block" : "hidden md:block"}>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5 lg:gap-2">
            <div ref={searchRef} className="relative hidden lg:block">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search products, customers..." className="h-9 w-48 pl-8 lg:w-64" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }} onFocus={() => setSearchOpen(true)} />
              {searchOpen && searchQuery.trim() && (
                <div className="absolute top-full mt-1 w-72 sm:w-80 rounded-md border bg-popover shadow-md z-50 max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
                  ) : searchResults.products.length === 0 && searchResults.customers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
                  ) : (
                    <>
                      {searchResults.products.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Products</div>
                          {searchResults.products.map((p) => (
                            <Link key={p.id} href={`/dashboard/products/${p.id}`} onClick={() => { setSearchOpen(false); setSearchQuery("") }}>
                              <div className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                                <span className="font-medium">{p.name}</span>
                                {p.category?.name && <span className="text-xs text-muted-foreground">{p.category.name}</span>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.customers.length > 0 && (
                        <div className="p-2 border-t">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Customers</div>
                          {searchResults.customers.map((c) => (
                            <Link key={c.id} href={`/dashboard/customers/${c.id}`} onClick={() => { setSearchOpen(false); setSearchQuery("") }}>
                              <div className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                                <span className="font-medium">{c.name}</span>
                                {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {mounted && resolvedTheme === "dark" ? (
                <HugeiconsIcon icon={Sun02Icon} strokeWidth={2} className="size-5" />
              ) : (
                <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className="size-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
                  <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-4 shrink-0" />
                  <span className="hidden sm:inline">
                    {selectedBranch === "all" ? "All Branches" : branches.find((b) => b.id === selectedBranch)?.name || "Branch"}
                  </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedBranch("all")}>All Branches</DropdownMenuItem>
                {branches.map((b) => (
                  <DropdownMenuItem key={b.id} onClick={() => setSelectedBranch(b.id)}>{b.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="default" size="sm" className="gap-2" />}>
                <HugeiconsIcon icon={FlashIcon} strokeWidth={2} className="size-4" />
                <span className="hidden sm:inline">Quick Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Create New</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/invoices/new")}>
                  <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} className="size-4" /> Add Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/proforma/new")}>
                  <HugeiconsIcon icon={File02Icon} strokeWidth={2} className="size-4" /> Add Proforma
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/payments/receive")}>
                  <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} className="size-4" /> Receive Payment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/sales-receipts")}>
                  <HugeiconsIcon icon={ReceiptIcon} strokeWidth={2} className="size-4" /> Sales Receipts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/pos")}>
                  <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-4" /> POS
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/customers/new")}>
                  <HugeiconsIcon icon={UsersIcon} strokeWidth={2} className="size-4" /> Add New Client
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/users/new")}>
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" /> Add Staff
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/purchases/new")}>
                  <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} className="size-4" /> Add Purchase Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/bills/pay")}>
                  <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-4" /> Pay Bills
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/expenses")}>
                  <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-4" /> Add Expenses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/purchases/suppliers/new")}>
                  <HugeiconsIcon icon={TruckIcon} strokeWidth={2} className="size-4" /> Add Supplier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/hr/employees")}>
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" /> HR Module
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/hr/attendance")}>
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" /> Mark Attendance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/hr/payroll")}>
                  <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-4" /> Run Payroll
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/hr/leave")}>
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" /> Leave Requests
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/transactions")}>
                  <HugeiconsIcon icon={ArrowLeftRightIcon} strokeWidth={2} className="size-4" /> All Transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/transactions/journal-entry")}>
                  <HugeiconsIcon icon={Book01Icon} strokeWidth={2} className="size-4" /> Journal Entry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/transactions/fund-transfer")}>
                  <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} strokeWidth={2} className="size-4" /> Fund Transfer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/transactions/give-loan")}>
                  <HugeiconsIcon icon={BanknoteIcon} strokeWidth={2} className="size-4" /> Give Loan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/reports")}>
                  <HugeiconsIcon icon={ChartIcon} strokeWidth={2} className="size-4" /> Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
                  <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} className="size-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 size-5 items-center justify-center p-0 text-xs" variant="destructive">
                      {unreadCount}
                    </Badge>
                  )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 sm:w-80">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.message}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-3 p-3 pt-0 sm:gap-4 sm:p-4 sm:pt-0">
          {children}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}

export function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  return (
    <DashboardInner breadcrumbs={breadcrumbs}>{children}</DashboardInner>
  )
}
