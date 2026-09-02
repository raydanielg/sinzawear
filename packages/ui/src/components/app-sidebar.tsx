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
  ReceiptIcon,
  TruckIcon,
  Wallet01Icon,
  Book01Icon,
  ArrowDataTransferHorizontalIcon,
  BanknoteIcon,
  ChartLineIcon,
  ClipboardListIcon,
  BoxesIcon,
  CalendarIcon,
  MoneyCheckIcon,
  Bell01Icon,
  ShoppingCart01Icon,
  CreditCardIcon,
  CarIcon,
  PalletIcon,
  CubeIcon,
  FileAltIcon,
  DesktopIcon,
  TaxIcon,
  BuildingIcon,
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
      title: "Dashboard Analytics",
      url: "/dashboard/executive/analytics",
      icon: (
        <HugeiconsIcon icon={ChartLineIcon} strokeWidth={2} />
      ),
      items: [
        { title: "Business Analytics", url: "/dashboard/executive/analytics" },
        { title: "HR Analytics", url: "/dashboard/executive/hr-analytics" },
      ],
    },
    {
      title: "Banking",
      url: "/dashboard/accounting/banking",
      icon: (
        <HugeiconsIcon icon={BanknoteIcon} strokeWidth={2} />
      ),
      items: [
        { title: "Banking Overview", url: "/dashboard/accounting/banking" },
        { title: "Fund Transfer", url: "/dashboard/transactions/fund-transfer" },
      ],
    },
    {
      title: "Sales",
      url: "/dashboard/sales",
      icon: (
        <HugeiconsIcon icon={Cash01Icon} strokeWidth={2} />
      ),
      items: [
        { title: "Sales Transactions", url: "/dashboard/sales" },
        { title: "POS", url: "/dashboard/pos" },
        { title: "Sales Receipts", url: "/dashboard/sales-receipts" },
        { title: "Invoices", url: "/dashboard/invoices" },
        { title: "Proforma", url: "/dashboard/proforma" },
        { title: "Returns", url: "/dashboard/returns" },
        { title: "Clients", url: "/dashboard/customers" },
        { title: "Receive Payment", url: "/dashboard/payments/receive" },
      ],
    },
    {
      title: "Expenses",
      url: "/dashboard/expenses",
      icon: (
        <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />
      ),
      items: [
        { title: "Expense Transactions", url: "/dashboard/expenses" },
        { title: "Suppliers/Vendors", url: "/dashboard/purchases/suppliers" },
        { title: "Pay Bills", url: "/dashboard/bills/pay" },
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
        { title: "Suppliers", url: "/dashboard/purchases/suppliers" },
        { title: "Pay Bills", url: "/dashboard/bills/pay" },
      ],
    },
    {
      title: "Product & Services",
      url: "/dashboard/products",
      icon: (
        <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
      ),
      items: [
        { title: "Products", url: "/dashboard/products" },
        { title: "Inventory", url: "/dashboard/inventory" },
        { title: "Stock Movements", url: "/dashboard/inventory/movements" },
        { title: "Transfers", url: "/dashboard/inventory/transfers" },
        { title: "Adjustments", url: "/dashboard/inventory/adjustments" },
      ],
    },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: (
        <HugeiconsIcon icon={ArrowLeftRightIcon} strokeWidth={2} />
      ),
      items: [
        { title: "All Transactions", url: "/dashboard/transactions" },
        { title: "Subscription Sale", url: "/dashboard/transactions/subscription-sale" },
        { title: "Sales Order", url: "/dashboard/transactions/sales-order" },
        { title: "Credit Sale/Loan", url: "/dashboard/transactions/credit-sale" },
        { title: "Credit Memo", url: "/dashboard/transactions/credit-memo" },
        { title: "Sales Refund", url: "/dashboard/transactions/sales-refund" },
        { title: "Payroll Liabilities", url: "/dashboard/transactions/payroll-liabilities" },
        { title: "Vendor Credit", url: "/dashboard/transactions/vendor-credit" },
        { title: "Employee Allowance", url: "/dashboard/transactions/employee-allowance" },
        { title: "Employee Deduction", url: "/dashboard/transactions/employee-deduction" },
        { title: "Employee Loan", url: "/dashboard/transactions/employee-loan" },
        { title: "Mid Month Payroll", url: "/dashboard/transactions/mid-month-payroll" },
        { title: "Journal Entry", url: "/dashboard/transactions/journal-entry" },
        { title: "Journal Adjustment", url: "/dashboard/transactions/journal-adjustment" },
        { title: "Fund Transfer", url: "/dashboard/transactions/fund-transfer" },
        { title: "Owners Deposit", url: "/dashboard/transactions/owners-deposit" },
        { title: "Owners Drawing", url: "/dashboard/transactions/owners-drawing" },
        { title: "Give Loan", url: "/dashboard/transactions/give-loan" },
        { title: "Loan Deposit", url: "/dashboard/transactions/loan-deposit" },
        { title: "Loan Repayment", url: "/dashboard/transactions/loan-repayment" },
        { title: "Receive Loan Repayment", url: "/dashboard/transactions/receive-loan-repayment" },
      ],
    },
    {
      title: "HR",
      url: "/dashboard/hr",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
      items: [
        { title: "Overview", url: "/dashboard/hr" },
        { title: "Employees", url: "/dashboard/hr/employees" },
        { title: "Departments", url: "/dashboard/hr/departments" },
        { title: "Attendance", url: "/dashboard/hr/attendance" },
        { title: "Payroll", url: "/dashboard/hr/payroll" },
        { title: "Staff Leave", url: "/dashboard/hr/leave" },
      ],
    },
    {
      title: "Accounting",
      url: "/dashboard/accounting",
      icon: (
        <HugeiconsIcon icon={Book01Icon} strokeWidth={2} />
      ),
      items: [
        { title: "P&L Statement", url: "/dashboard/accounting" },
        { title: "Banking & Cash", url: "/dashboard/accounting/banking" },
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
        { title: "Executive Analytics", url: "/dashboard/executive/analytics" },
        { title: "HR Analytics", url: "/dashboard/executive/hr-analytics" },
      ],
    },
    {
      title: "Management",
      url: "/dashboard/branches",
      icon: (
        <HugeiconsIcon icon={Store02Icon} strokeWidth={2} />
      ),
      items: [
        { title: "Branches", url: "/dashboard/branches" },
        { title: "Users", url: "/dashboard/users" },
        { title: "Roles & Permissions", url: "/dashboard/settings/roles" },
        { title: "Audit Logs", url: "/dashboard/audit-logs" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
      items: [
        { title: "System Definitions", url: "/dashboard/settings" },
        { title: "Business Info", url: "/dashboard/settings" },
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
      name: "New Invoice",
      url: "/dashboard/invoices/new",
      icon: (
        <HugeiconsIcon icon={File02Icon} strokeWidth={2} />
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
    {
      name: "Add Supplier",
      url: "/dashboard/purchases/suppliers/new",
      icon: (
        <HugeiconsIcon icon={TruckIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Add Client",
      url: "/dashboard/customers/new",
      icon: (
        <HugeiconsIcon icon={UsersIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Add Staff",
      url: "/dashboard/users/new",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Pay Bills",
      url: "/dashboard/bills/pay",
      icon: (
        <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Sales Receipts",
      url: "/dashboard/sales-receipts",
      icon: (
        <HugeiconsIcon icon={ReceiptIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Add Employee",
      url: "/dashboard/hr/employees",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Run Payroll",
      url: "/dashboard/hr/payroll",
      icon: (
        <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "Journal Entry",
      url: "/dashboard/transactions/journal-entry",
      icon: (
        <HugeiconsIcon icon={Book01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "Fund Transfer",
      url: "/dashboard/transactions/fund-transfer",
      icon: (
        <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} strokeWidth={2} />
      ),
    },
    {
      name: "Give Loan",
      url: "/dashboard/transactions/give-loan",
      icon: (
        <HugeiconsIcon icon={BanknoteIcon} strokeWidth={2} />
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
