import React, { useEffect, useState, useCallback, useMemo } from "react";
import { SalesApi, ProductsApi, CustomersApi } from "../api/endpoints";
import type { Customer, PaymentMethod, Product, Sale } from "../types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Modal,
  PageHeader,
  Select,
  money,
} from "../components/ui";
import { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface CartLine {
  product: Product;
  quantity: number;
}

export function Sales() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"pos" | "history">("pos");
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [viewSale, setViewSale] = useState<Sale | null>(null);

  const loadProducts = useCallback(() => {
    ProductsApi.list({ search: productSearch || undefined, pageSize: 50 }).then((res) =>
      setProducts(res.data.data)
    );
  }, [productSearch]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 200);
    return () => clearTimeout(t);
  }, [loadProducts]);

  useEffect(() => {
    CustomersApi.list().then((res) => setCustomers(res.data));
  }, []);

  const loadSales = useCallback(() => {
    setSalesLoading(true);
    SalesApi.list({ pageSize: 50 })
      .then((res) => setSales(res.data.data))
      .finally(() => setSalesLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "history") loadSales();
  }, [tab, loadSales]);

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === p.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === p.id ? { ...l, quantity: Math.min(l.quantity + 1, p.stockQuantity) } : l
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  }

  function updateQty(productId: number, qty: number) {
    setCart((prev) =>
      prev.map((l) =>
        l.product.id === productId ? { ...l, quantity: Math.max(1, Math.min(qty, l.product.stockQuantity)) } : l
      )
    );
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.product.sellingPrice * l.quantity, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await SalesApi.create({
        customerId: customerId ? Number(customerId) : null,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        paymentMethod,
      });
      setLastSale(res.data);
      setCart([]);
      setCustomerId("");
      setDiscount("0");
      setTax("0");
      loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelSale(s: Sale) {
    if (!confirm(`Cancel sale ${s.invoiceNumber}? Stock will be restored.`)) return;
    try {
      await SalesApi.cancel(s.id);
      loadSales();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Sales / POS" subtitle="Ring up sales and view sales history" />

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {(["pos", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "pos" ? "New Sale" : "Sales History"}
          </button>
        ))}
      </div>

      {tab === "pos" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-2">
            <Input
              placeholder="Search products to add..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-3"
            />
            <div className="max-h-[420px] overflow-y-auto space-y-1">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stockQuantity === 0}
                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed border border-transparent hover:border-slate-200"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">
                      {p.sku} · {p.stockQuantity} in stock
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{money(p.sellingPrice)}</div>
                </button>
              ))}
              {products.length === 0 && <EmptyState message="No products found." />}
            </div>
          </Card>

          <Card className="p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Cart</h3>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}
            <div className="flex-1 space-y-2 mb-3 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <EmptyState message="Cart is empty" />
              ) : (
                cart.map((l) => (
                  <div key={l.product.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-slate-800">{l.product.name}</div>
                      <div className="text-xs text-slate-400">{money(l.product.sellingPrice)} each</div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={l.product.stockQuantity}
                      value={l.quantity}
                      onChange={(e) => updateQty(l.product.id, Number(e.target.value))}
                      className="w-14 border border-slate-300 rounded px-1 py-1 text-center text-sm"
                    />
                    <button onClick={() => removeLine(l.product.id)} className="text-red-500 text-xs">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div>
                <Label>Customer (optional)</Label>
                <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Walk-in customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Discount</Label>
                  <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <Label>Tax</Label>
                  <Input type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div className="flex justify-between text-sm text-slate-500 pt-1">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              <Button className="w-full" disabled={cart.length === 0 || submitting} onClick={handleCheckout}>
                {submitting ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          {salesLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : sales.length === 0 ? (
            <EmptyState message="No sales yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button className="font-medium text-brand-700 hover:underline" onClick={() => setViewSale(s)}>
                          {s.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.customer?.name ?? "Walk-in"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{s.user?.name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={s.status === "COMPLETED" ? "green" : "red"}>{s.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{money(s.total)}</td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && s.status === "COMPLETED" && (
                          <button onClick={() => handleCancelSale(s)} className="text-red-600 hover:underline text-xs">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={!!lastSale} onClose={() => setLastSale(null)} title="Sale Complete">
        {lastSale && <InvoiceView sale={lastSale} />}
      </Modal>

      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title={viewSale?.invoiceNumber ?? ""}>
        {viewSale && <InvoiceView sale={viewSale} />}
      </Modal>
    </div>
  );
}

function InvoiceView({ sale }: { sale: Sale }) {
  return (
    <div>
      <div className="flex justify-between text-sm text-slate-500 mb-4">
        <span>{sale.customer?.name ?? "Walk-in customer"}</span>
        <span>{new Date(sale.createdAt).toLocaleString()}</span>
      </div>
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
            <th className="py-1.5">Item</th>
            <th className="py-1.5 text-right">Qty</th>
            <th className="py-1.5 text-right">Price</th>
            <th className="py-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((i) => (
            <tr key={i.id} className="border-b border-slate-100">
              <td className="py-1.5">{i.product?.name ?? `#${i.productId}`}</td>
              <td className="py-1.5 text-right">{i.quantity}</td>
              <td className="py-1.5 text-right">{money(i.unitPrice)}</td>
              <td className="py-1.5 text-right">{money(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>{money(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Discount</span>
          <span>-{money(sale.discount)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Tax</span>
          <span>{money(sale.tax)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold pt-1 border-t border-slate-200">
          <span>Total</span>
          <span>{money(sale.total)}</span>
        </div>
        <div className="text-xs text-slate-400 pt-1">Payment method: {sale.paymentMethod}</div>
      </div>
    </div>
  );
}
