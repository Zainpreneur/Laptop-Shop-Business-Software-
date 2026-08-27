import { api } from "./client";
import type {
  AuthUser,
  Brand,
  Category,
  Customer,
  DashboardSummary,
  PaginatedResponse,
  Product,
  PurchaseOrder,
  RepairTicket,
  Sale,
  Supplier,
} from "../types";

// --- Auth ---
export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password }),
  me: () => api.get<AuthUser>("/auth/me"),
};

// --- Users (admin) ---
export const UsersApi = {
  list: () => api.get<AuthUser[]>("/users"),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post("/users", data),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
  remove: (id: number) => api.delete(`/users/${id}`),
};

// --- Catalog ---
export const CatalogApi = {
  brands: () => api.get<Brand[]>("/catalog/brands"),
  createBrand: (name: string) => api.post<Brand>("/catalog/brands", { name }),
  deleteBrand: (id: number) => api.delete(`/catalog/brands/${id}`),
  categories: () => api.get<Category[]>("/catalog/categories"),
  createCategory: (name: string) => api.post<Category>("/catalog/categories", { name }),
  deleteCategory: (id: number) => api.delete(`/catalog/categories/${id}`),
};

// --- Products ---
export const ProductsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<PaginatedResponse<Product>>("/products", { params }),
  get: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>("/products", data),
  update: (id: number, data: Partial<Product>) => api.patch<Product>(`/products/${id}`, data),
  remove: (id: number) => api.delete(`/products/${id}`),
};

// --- Customers ---
export const CustomersApi = {
  list: (search?: string) => api.get<Customer[]>("/customers", { params: { search } }),
  get: (id: number) => api.get<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>("/customers", data),
  update: (id: number, data: Partial<Customer>) => api.patch<Customer>(`/customers/${id}`, data),
  remove: (id: number) => api.delete(`/customers/${id}`),
};

// --- Suppliers ---
export const SuppliersApi = {
  list: (search?: string) => api.get<Supplier[]>("/suppliers", { params: { search } }),
  get: (id: number) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Partial<Supplier>) => api.post<Supplier>("/suppliers", data),
  update: (id: number, data: Partial<Supplier>) => api.patch<Supplier>(`/suppliers/${id}`, data),
  remove: (id: number) => api.delete(`/suppliers/${id}`),
};

// --- Sales ---
export const SalesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<PaginatedResponse<Sale>>("/sales", { params }),
  get: (id: number) => api.get<Sale>(`/sales/${id}`),
  create: (data: {
    customerId?: number | null;
    items: { productId: number; quantity: number }[];
    discount?: number;
    tax?: number;
    paymentMethod?: string;
    notes?: string;
  }) => api.post<Sale>("/sales", data),
  cancel: (id: number) => api.post<Sale>(`/sales/${id}/cancel`),
};

// --- Purchase Orders ---
export const PurchaseOrdersApi = {
  list: (params?: Record<string, string | undefined>) =>
    api.get<PurchaseOrder[]>("/purchase-orders", { params }),
  get: (id: number) => api.get<PurchaseOrder>(`/purchase-orders/${id}`),
  create: (data: {
    supplierId: number;
    items: { productId: number; quantity: number; unitCost: number }[];
    notes?: string;
  }) => api.post<PurchaseOrder>("/purchase-orders", data),
  receive: (id: number) => api.post<PurchaseOrder>(`/purchase-orders/${id}/receive`),
  cancel: (id: number) => api.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`),
};

// --- Repair Tickets ---
export const RepairsApi = {
  list: (params?: Record<string, string | undefined>) =>
    api.get<RepairTicket[]>("/repair-tickets", { params }),
  get: (id: number) => api.get<RepairTicket>(`/repair-tickets/${id}`),
  create: (data: Partial<RepairTicket>) => api.post<RepairTicket>("/repair-tickets", data),
  update: (id: number, data: Partial<RepairTicket>) =>
    api.patch<RepairTicket>(`/repair-tickets/${id}`, data),
  remove: (id: number) => api.delete(`/repair-tickets/${id}`),
};

// --- Dashboard ---
export const DashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary"),
};
