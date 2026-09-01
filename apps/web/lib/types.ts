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

export interface ApiResult<T = unknown> {
  success: boolean
  message?: string
  data: T
  errors?: { field: string; message: string }[]
}
