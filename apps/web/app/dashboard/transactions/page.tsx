"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@workspace/ui/components/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cash01Icon,
  File02Icon,
  ReceiptIcon,
  ShoppingBag01Icon,
  RepeatIcon,
  Calendar03Icon,
  FileAddIcon,
  CancelCircleIcon,
  CoinsIcon,
  Wallet01Icon,
  PackageReceiveIcon,
  UserGroupIcon,
  GiftIcon,
  CircleMinusIcon,
  BanknoteIcon,
  CalendarAddIcon,
  Book01Icon,
  SlidersHorizontalIcon,
  ArrowDataTransferHorizontalIcon,
  UserRemoveIcon,
  PiggyBankIcon,
  AddMoneyCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"

const categories = [
  {
    title: "Sale",
    icon: Cash01Icon,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    items: [
      { label: "Invoice", href: "/dashboard/invoices", icon: File02Icon, desc: "Create and manage invoices" },
      { label: "Invoice Payments", href: "/dashboard/payments/receive", icon: CoinsIcon, desc: "Record payments against invoices" },
      { label: "Sales Receipt", href: "/dashboard/sales-receipts", icon: ReceiptIcon, desc: "View sales receipts" },
      { label: "Point of Sale", href: "/dashboard/pos", icon: ShoppingBag01Icon, desc: "Process POS transactions" },
      { label: "Subscription Sale", href: "/dashboard/transactions/subscription-sale", icon: RepeatIcon, desc: "Manage recurring subscriptions" },
      { label: "Sales Order", href: "/dashboard/transactions/sales-order", icon: FileAddIcon, desc: "Create sales orders" },
      { label: "Proforma", href: "/dashboard/proforma", icon: File02Icon, desc: "Create proforma invoices" },
      { label: "Credit Sale/Loan", href: "/dashboard/transactions/credit-sale", icon: Wallet01Icon, desc: "Manage credit sales and loans" },
      { label: "Credit Memo", href: "/dashboard/transactions/credit-memo", icon: File02Icon, desc: "Issue credit memos to customers" },
      { label: "Sales Refund", href: "/dashboard/transactions/sales-refund", icon: CancelCircleIcon, desc: "Process sales refunds" },
    ],
  },
  {
    title: "Expense",
    icon: CoinsIcon,
    color: "text-red-600",
    bg: "bg-red-500/10",
    items: [
      { label: "Bill", href: "/dashboard/purchases", icon: PackageReceiveIcon, desc: "Manage vendor bills" },
      { label: "Bill Payment", href: "/dashboard/bills/pay", icon: CoinsIcon, desc: "Pay outstanding bills" },
      { label: "Payroll Liabilities", href: "/dashboard/transactions/payroll-liabilities", icon: Wallet01Icon, desc: "Track payroll tax and deductions" },
      { label: "Expense", href: "/dashboard/expenses", icon: CoinsIcon, desc: "Record business expenses" },
      { label: "Purchase Order", href: "/dashboard/purchases", icon: PackageReceiveIcon, desc: "Create purchase orders" },
      { label: "Vendor Credit", href: "/dashboard/transactions/vendor-credit", icon: CancelCircleIcon, desc: "Manage vendor credit notes" },
    ],
  },
  {
    title: "HR",
    icon: UserGroupIcon,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    items: [
      { label: "Employee", href: "/dashboard/hr/employees", icon: UserGroupIcon, desc: "Manage employee records" },
      { label: "Employee Allowance", href: "/dashboard/transactions/employee-allowance", icon: GiftIcon, desc: "Set up employee allowances" },
      { label: "Employee Deduction", href: "/dashboard/transactions/employee-deduction", icon: CircleMinusIcon, desc: "Manage employee deductions" },
      { label: "Employee Loan", href: "/dashboard/transactions/employee-loan", icon: BanknoteIcon, desc: "Track employee loans" },
      { label: "Monthly Payroll", href: "/dashboard/hr/payroll", icon: Calendar03Icon, desc: "Run monthly payroll" },
      { label: "Mid Month Payroll", href: "/dashboard/transactions/mid-month-payroll", icon: CalendarAddIcon, desc: "Process mid-month advances" },
    ],
  },
  {
    title: "Other",
    icon: Book01Icon,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    items: [
      { label: "Journal Entry", href: "/dashboard/transactions/journal-entry", icon: Book01Icon, desc: "Create manual journal entries" },
      { label: "Journal Adjustment", href: "/dashboard/transactions/journal-adjustment", icon: SlidersHorizontalIcon, desc: "Adjust existing journal entries" },
      { label: "Fund Transfer", href: "/dashboard/transactions/fund-transfer", icon: ArrowDataTransferHorizontalIcon, desc: "Transfer funds between accounts" },
      { label: "Owners Deposit/Contribution", href: "/dashboard/transactions/owners-deposit", icon: PiggyBankIcon, desc: "Record owner capital contributions" },
      { label: "Owners Drawing", href: "/dashboard/transactions/owners-drawing", icon: UserRemoveIcon, desc: "Record owner withdrawals" },
      { label: "Loan Deposit", href: "/dashboard/transactions/loan-deposit", icon: PiggyBankIcon, desc: "Record loan deposits received" },
      { label: "Loan Repayment", href: "/dashboard/transactions/loan-repayment", icon: AddMoneyCircleIcon, desc: "Record loan repayments made" },
      { label: "Give Loan", href: "/dashboard/transactions/give-loan", icon: BanknoteIcon, desc: "Issue loans to borrowers" },
      { label: "Receive Loan Repayment", href: "/dashboard/transactions/receive-loan-repayment", icon: CheckmarkCircle02Icon, desc: "Record loan repayments received" },
    ],
  },
]

export default function TransactionsHubPage() {
  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">All transaction types organized by category</p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.title}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg ${cat.bg}`}>
                <HugeiconsIcon icon={cat.icon} strokeWidth={2} className={`size-5 ${cat.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{cat.title}</h2>
                <p className="text-sm text-muted-foreground">{cat.items.length} transaction types</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cat.items.map((item) => (
                <Link key={item.label} href={item.href}>
                  <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-tight">{item.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
