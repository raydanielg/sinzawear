"use client"

import * as React from "react"

import { NavMain } from "@workspace/ui/components/nav-main"
import { NavProjects } from "@workspace/ui/components/nav-projects"
import { NavUser } from "@workspace/ui/components/nav-user"
import { TeamSwitcher } from "@workspace/ui/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare02Icon,
  ShoppingBag01Icon,
  Shirt01Icon,
  UsersIcon,
  ChartIcon,
  Settings05Icon,
  CoinsIcon,
  CustomerService01Icon,
  Store02Icon,
  Package02Icon,
  StarAwardIcon,
  Image02Icon,
  PackageReceiveIcon,
  MapIcon,
  File02Icon,
  UserGroupIcon,
  ArrowLeftRightIcon,
  Cash01Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons"

const data = {
  teams: [
    {
      name: "Sinza Fashion",
      logo: (
        <img
          src="/assets/social-media.png"
          alt="Sinza"
          className="size-5 rounded-sm object-cover"
        />
      ),
      plan: "Retail Management",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2} />
      ),
      isActive: true,
      items: [
        { title: "Overview", url: "/dashboard" },
      ],
    },
    {
      title: "Sales",
      url: "/dashboard/pos",
      icon: (
        <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} />
      ),
      items: [
        { title: "POS", url: "/dashboard/pos" },
        { title: "Sales", url: "/dashboard/sales" },
        { title: "Returns", url: "/dashboard/returns" },
      ],
    },
    {
      title: "Inventory",
      url: "/dashboard/inventory",
      icon: (
        <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
      ),
      items: [
        { title: "Products", url: "/dashboard/products" },
        { title: "Stock", url: "/dashboard/inventory" },
        { title: "Movements", url: "/dashboard/inventory/movements" },
        { title: "Transfers", url: "/dashboard/inventory/transfers" },
        { title: "Adjustments", url: "/dashboard/inventory/adjustments" },
      ],
    },
    {
      title: "Purchasing",
      url: "/dashboard/purchases",
      icon: (
        <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} />
      ),
      items: [
        { title: "Purchases", url: "/dashboard/purchases" },
        { title: "Suppliers", url: "/dashboard/suppliers" },
      ],
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: (
        <HugeiconsIcon icon={UsersIcon} strokeWidth={2} />
      ),
      items: [
        { title: "All Customers", url: "/dashboard/customers" },
      ],
    },
    {
      title: "Finance",
      url: "/dashboard/expenses",
      icon: (
        <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} />
      ),
      items: [
        { title: "Expenses", url: "/dashboard/expenses" },
        { title: "Accounting", url: "/dashboard/accounting" },
        { title: "Cash Register", url: "/dashboard/cash-register" },
      ],
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: (
        <HugeiconsIcon icon={ChartIcon} strokeWidth={2} />
      ),
      items: [
        { title: "Overview", url: "/dashboard/reports" },
        { title: "Sales Report", url: "/dashboard/reports/sales" },
        { title: "Profit Report", url: "/dashboard/reports/profit" },
        { title: "Inventory Report", url: "/dashboard/reports/inventory" },
        { title: "Purchases Report", url: "/dashboard/reports/purchases" },
        { title: "Branches Report", url: "/dashboard/reports/branches" },
      ],
    },
    {
      title: "Management",
      url: "/dashboard/branches",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
      items: [
        { title: "Branches", url: "/dashboard/branches" },
        { title: "Users", url: "/dashboard/users" },
        { title: "Roles & Permissions", url: "/dashboard/settings/roles" },
      ],
    },
    {
      title: "Audit Logs",
      url: "/dashboard/audit-logs",
      icon: (
        <HugeiconsIcon icon={File02Icon} strokeWidth={2} />
      ),
      items: [
        { title: "Activity Log", url: "/dashboard/audit-logs" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
      items: [
        { title: "Business", url: "/dashboard/settings" },
        { title: "Roles", url: "/dashboard/settings/roles" },
      ],
    },
  ],
  projects: [
    {
      name: "New Sale",
      url: "/dashboard/pos",
      icon: (
        <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "Add Product",
      url: "/dashboard/products/new",
      icon: (
        <HugeiconsIcon icon={Shirt01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "New Purchase",
      url: "/dashboard/purchases/new",
      icon: (
        <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "User",
    email: "user@sinza.co.tz",
    avatar: "",
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setUser({
            name: parsed.name || "User",
            email: parsed.email || "",
            avatar: parsed.avatar || "",
          })
        } catch {}
      }
    }
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
