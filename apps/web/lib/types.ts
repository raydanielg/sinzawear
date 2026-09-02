export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  roles: string[]
  permissions: string[]
  isActive: boolean
  address?: string
  branch?: Branch
  company?: Company
  createdAt: string
}

export interface Company {
  id: string
  name: string
  code: string
  phone?: string
  email?: string
  address?: string
  logo?: string
  currency: string
  taxRate: number
  receiptPrefix: string
  invoicePrefix: string
  lowStockThreshold: number
  status: string
}

export interface Branch {
  id: string
  name: string
  code: string
  location?: string
  phone?: string
  managerId?: string
  manager?: User
  openingBalance: number
  status: string
  companyId: string
  createdAt: string
  _count?: { users: number; sales: number }
}

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
  rolePermissions?: { permission: Permission }[]
  _count?: { userRoles: number }
}

export interface Permission {
  id: string
  name: string
  module: string
  description?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  image?: string
  status: string
  category?: Category
  brand?: Brand
  variants?: ProductVariant[]
  companyId: string
  categoryId?: string
  brandId?: string
}

export interface Category {
  id: string
  name: string
  parent?: Category
  parentId?: string
}

export interface Brand {
  id: string
  name: string
}

export interface Size {
  id: string
  name: string
}

export interface Color {
  id: string
  name: string
  hexCode?: string
}

export interface ProductVariant {
  id: string
  sku: string
  barcode?: string
  costPrice: number
  sellingPrice: number
  reorderLevel: number
  status: string
  productId: string
  product?: Product
  sizeId?: string
  size?: Size
  colorId?: string
  color?: Color
}

export interface BranchStock {
  id: string
  quantity: number
  reorderLevel: number
  branchId: string
  branch?: Branch
  variantId: string
  variant?: ProductVariant
}

export interface StockMovement {
  id: string
  type: string
  quantity: number
  previousQuantity: number
  newQuantity: number
  note?: string
  referenceType?: string
  referenceId?: string
  createdAt: string
  branchId: string
  branch?: Branch
  variantId: string
  variant?: ProductVariant
}

export interface StockTransfer {
  id: string
  transferNo: string
  status: string
  notes?: string
  createdAt: string
  fromBranchId: string
  fromBranch?: Branch
  toBranchId: string
  toBranch?: Branch
  requestedBy?: User
  approvedBy?: User
  receivedBy?: User
  items?: StockTransferItem[]
}

export interface StockTransferItem {
  id: string
  quantity: number
  variantId: string
  variant?: ProductVariant
}

export interface Sale {
  id: string
  saleNumber: string
  subtotal: number
  discount: number
  total: number
  status: string
  note?: string
  createdAt: string
  cashierId: string
  cashier?: User
  customerId?: string
  customer?: Customer
  branchId: string
  branch?: Branch
  items?: SaleItem[]
  payments?: SalePayment[]
  returns?: SaleReturn[]
}

export interface SaleItem {
  id: string
  quantity: number
  unitPrice: number
  costPrice: number
  total: number
  variantId: string
  variant?: ProductVariant
  saleId: string
}

export interface SalePayment {
  id: string
  method: string
  amount: number
  reference?: string
  saleId: string
}

export interface SaleReturn {
  id: string
  returnNumber: string
  reason: string
  refundAmount: number
  refundMethod: string
  status: string
  createdAt: string
  saleId: string
  items?: SaleReturnItem[]
}

export interface SaleReturnItem {
  id: string
  quantity: number
  unitPrice: number
  total: number
  condition: string
  variantId: string
  variant?: ProductVariant
}

export interface Purchase {
  id: string
  purchaseNumber: string
  purchaseNo: string
  subtotal: number
  discount: number
  totalAmount: number
  paidAmount: number
  balance: number
  status: string
  note?: string
  createdAt: string
  supplierId: string
  supplier?: Supplier
  branchId: string
  branch?: Branch
  createdBy?: User
  items?: PurchaseItem[]
  payments?: SupplierPayment[]
}

export interface PurchaseItem {
  id: string
  quantity: number
  unitCost: number
  total: number
  variantId: string
  variant?: ProductVariant
}

export interface Supplier {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  tin?: string
  status: string
  active: boolean
  contactPerson?: string
  totalPurchases?: number
  totalPaid?: number
  balance?: number
  _count?: { purchases: number }
}

export interface SupplierPayment {
  id: string
  amount: number
  method: string
  reference?: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  totalPurchases: number
  loyaltyPoints: number
  status: string
  createdAt: string
  _count?: { sales: number }
}

export interface ExpenseCategory {
  id: string
  name: string
}

export interface Expense {
  id: string
  amount: number
  description?: string
  paymentMethod: string
  expenseDate: string
  date: string
  status: string
  createdAt: string
  category?: ExpenseCategory
  branch?: Branch
  user?: { name: string }
  createdBy?: User
}

export interface CashSession {
  id: string
  sessionNumber: string
  openingBalance: number
  openingFloat: number
  closingBalance?: number
  closingCash?: number | null
  expectedBalance?: number
  expectedCash?: number
  cashSales?: number
  cashRefunds?: number
  cashExpenses?: number
  difference?: number | null
  status: string
  openedAt: string
  closedAt?: string
  notes?: string
  branch?: Branch
  cashier?: User
  openedBy?: { name: string }
  closedBy?: { name: string }
  transactions?: CashTransaction[]
}

export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  oldValues?: string
  newValues?: string
  ipAddress?: string
  createdAt: string
  user?: { id: string; name: string; email: string }
  branch?: { id: string; name: string }
}

export interface CashTransaction {
  id: string
  type: string
  description?: string
  amount: number
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface DashboardData {
  totalSales: number
  todaySales: number
  todayTransactions: number
  totalProducts: number
  lowStock: number
  outOfStock: number
  customers: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
}

export interface Department {
  id: string
  name: string
  description?: string
  branchId?: string
  branch?: Branch
  createdAt: string
  _count?: { employees: number }
}

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  phone?: string
  address?: string
  gender?: string
  dateOfBirth?: string
  departmentId?: string
  department?: Department
  position: string
  employmentType: string
  hireDate: string
  salary: number
  allowance?: number
  status: string
  branchId?: string
  branch?: Branch
  userId?: string
  user?: User
  createdAt: string
}

export interface Attendance {
  id: string
  employeeId: string
  employee?: Employee
  date: string
  checkIn?: string
  checkOut?: string
  status: string
  notes?: string
  workHours?: number
  overtimeHours?: number
  createdAt: string
}

export interface Payroll {
  id: string
  payrollNumber: string
  employeeId: string
  employee?: Employee
  month: number
  year: number
  basicSalary: number
  allowances: number
  overtimePay: number
  deductions: number
  taxDeduction: number
  netPay: number
  status: string
  paymentDate?: string
  paymentMethod?: string
  reference?: string
  createdAt: string
}

export interface LeaveRequest {
  id: string
  leaveNumber: string
  employeeId: string
  employee?: Employee
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  approvedBy?: { name: string }
  approvedAt?: string
  createdAt: string
}

export interface SubscriptionSale {
  id: string
  subscriptionNumber: string
  customerId: string
  customer?: Customer
  planName: string
  amount: number
  billingCycle: string
  startDate: string
  endDate?: string
  nextBillingDate?: string
  status: string
  autoRenew: boolean
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface SalesOrder {
  id: string
  orderNumber: string
  customerId: string
  customer?: Customer
  orderDate: string
  expectedDeliveryDate?: string
  items: SalesOrderItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  status: string
  notes?: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface SalesOrderItem {
  id: string
  productVariantId: string
  productVariant?: { product?: { name: string }; sku: string }
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CreditSale {
  id: string
  creditNumber: string
  customerId: string
  customer?: Customer
  saleId?: string
  sale?: Sale
  amount: number
  paidAmount: number
  balance: number
  interestRate?: number
  dueDate: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface CreditMemo {
  id: string
  memoNumber: string
  customerId: string
  customer?: Customer
  saleId?: string
  sale?: Sale
  amount: number
  reason: string
  status: string
  appliedAmount: number
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface SalesRefund {
  id: string
  refundNumber: string
  customerId: string
  customer?: Customer
  saleId: string
  sale?: Sale
  amount: number
  reason: string
  refundMethod: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface PayrollLiability {
  id: string
  liabilityNumber: string
  payrollId?: string
  payroll?: Payroll
  employeeId: string
  employee?: Employee
  type: string
  amount: number
  paidAmount: number
  balance: number
  dueDate: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface VendorCredit {
  id: string
  creditNumber: string
  supplierId: string
  supplier?: Supplier
  purchaseId?: string
  purchase?: Purchase
  amount: number
  appliedAmount: number
  balance: number
  reason: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface EmployeeAllowance {
  id: string
  employeeId: string
  employee?: Employee
  type: string
  amount: number
  frequency: string
  effectiveDate: string
  endDate?: string
  status: string
  notes?: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface EmployeeDeduction {
  id: string
  employeeId: string
  employee?: Employee
  type: string
  amount: number
  frequency: string
  effectiveDate: string
  endDate?: string
  status: string
  notes?: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface EmployeeLoan {
  id: string
  loanNumber: string
  employeeId: string
  employee?: Employee
  principalAmount: number
  interestRate: number
  totalRepayable: number
  paidAmount: number
  balance: number
  installmentAmount: number
  installments: number
  paidInstallments: number
  startDate: string
  status: string
  notes?: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface JournalEntry {
  id: string
  entryNumber: string
  date: string
  description: string
  reference?: string
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
  status: string
  branchId?: string
  branch?: Branch
  createdBy?: { name: string }
  createdAt: string
}

export interface JournalLine {
  id: string
  accountName: string
  accountCode: string
  debit: number
  credit: number
  description?: string
}

export interface JournalAdjustment {
  id: string
  adjustmentNumber: string
  date: string
  reason: string
  originalEntryId?: string
  originalEntry?: JournalEntry
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface FundTransfer {
  id: string
  transferNumber: string
  fromAccount: string
  toAccount: string
  amount: number
  fee: number
  date: string
  reference?: string
  notes?: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface OwnersDeposit {
  id: string
  depositNumber: string
  ownerName: string
  amount: number
  date: string
  account: string
  notes?: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface OwnersDrawing {
  id: string
  drawingNumber: string
  ownerName: string
  amount: number
  date: string
  account: string
  reason?: string
  notes?: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface Loan {
  id: string
  loanNumber: string
  borrowerName: string
  borrowerType: string
  principalAmount: number
  interestRate: number
  totalRepayable: number
  paidAmount: number
  balance: number
  installmentAmount: number
  installments: number
  paidInstallments: number
  startDate: string
  endDate?: string
  status: string
  notes?: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface LoanRepayment {
  id: string
  repaymentNumber: string
  loanId: string
  loan?: Loan
  amount: number
  principalPortion: number
  interestPortion: number
  date: string
  paymentMethod: string
  reference?: string
  status: string
  branchId?: string
  branch?: Branch
  createdAt: string
}

export interface ApiResult<T = unknown> {
  success: boolean
  message?: string
  data: T
  errors?: { field: string; message: string }[]
}
