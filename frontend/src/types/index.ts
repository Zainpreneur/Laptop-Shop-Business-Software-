export type Role = "ADMIN" | "STAFF";
export type Condition = "NEW" | "USED" | "REFURBISHED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_MONEY" | "OTHER";
export type SaleStatus = "COMPLETED" | "REFUNDED" | "CANCELLED";
export type PurchaseOrderStatus = "PENDING" | "RECEIVED" | "CANCELLED";
export type RepairStatus =
  | "RECEIVED"
  | "DIAGNOSING"
  | "IN_PROGRESS"
  | "AWAITING_PARTS"
  | "COMPLETED"
  | "PICKED_UP"
  | "CANCELLED";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Brand {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  brandId: number | null;
  categoryId: number | null;
  brand?: Brand | null;
  category?: Category | null;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  screenSize: string | null;
  condition: Condition;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  sales?: Sale[];
  repairTickets?: RepairTicket[];
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  purchaseOrders?: PurchaseOrder[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: Product;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  customer?: Customer | null;
  userId: number;
  user?: { id: number; name: string };
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string | null;
  createdAt: string;
  items: SaleItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId: number;
  quantity: number;
  unitCost: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplier?: Supplier;
  userId: number;
  user?: { id: number; name: string };
  status: PurchaseOrderStatus;
  totalCost: number;
  notes: string | null;
  createdAt: string;
  receivedAt: string | null;
  items: PurchaseOrderItem[];
}

export interface RepairTicket {
  id: number;
  ticketNumber: string;
  customerId: number;
  customer?: Customer;
  technicianId: number | null;
  technician?: { id: number; name: string } | null;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string | null;
  issueDescription: string;
  status: RepairStatus;
  estimatedCost: number | null;
  finalCost: number | null;
  technicianNotes: string | null;
  receivedAt: string;
  completedAt: string | null;
}

export interface DashboardSummary {
  todayRevenue: number;
  todaySalesCount: number;
  monthRevenue: number;
  monthSalesCount: number;
  last30DaysRevenue: number;
  last30DaysProfit: number;
  stockValue: number;
  retailValue: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  openRepairTickets: number;
  pendingPurchaseOrders: number;
  salesTrend: { date: string; revenue: number }[];
  topProducts: { productId: number; name: string; quantity: number; revenue: number }[];
  recentSales: Sale[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
