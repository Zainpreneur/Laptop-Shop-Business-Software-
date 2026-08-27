import React, { useEffect, useState, useCallback, useMemo } from "react";
import { PurchaseOrdersApi, ProductsApi, SuppliersApi } from "../api/endpoints";
import type { Product, PurchaseOrder, Supplier } from "../types";
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

interface Line {
  product: Product;
  quantity: number;
  unitCost: number;
}

export function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    PurchaseOrdersApi.list({ status: statusFilter || undefined })
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(load, [load]);

  useEffect(() => {
    SuppliersApi.list().then((res) => setSuppliers(res.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      ProductsApi.list({ search: productSearch || undefined, pageSize: 30 }).then((res) =>
        setProducts(res.data.data)
      );
    }, 200);
    return () => clearTimeout(t);
  }, [productSearch]);

  function openCreate() {
    setSupplierId("");
    setLines([]);
    setError(null);
    setModalOpen(true);
  }

  function addLine(p: Product) {
    setLines((prev) => {
      if (prev.some((l) => l.product.id === p.id)) return prev;
      return [...prev, { product: p, quantity: 1, unitCost: p.costPrice }];
    });
  }

  function updateLine(productId: number, field: "quantity" | "unitCost", value: number) {
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, [field]: Math.max(0, value) } : l))
    );
  }

  function removeLine(productId: number) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const totalCost = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0),
    [lines]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || lines.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await PurchaseOrdersApi.create({
        supplierId: Number(supplierId),
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, unitCost: l.unitCost })),
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleReceive(po: PurchaseOrder) {
    if (!confirm(`Mark PO ${po.poNumber} as received? This will add stock for all items.`)) return;
    try {
      await PurchaseOrdersApi.receive(po.id);
      load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  async function handleCancel(po: PurchaseOrder) {
    if (!confirm(`Cancel PO ${po.poNumber}?`)) return;
    try {
      await PurchaseOrdersApi.cancel(po.id);
      load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  const statusColor = (s: string) => (s === "RECEIVED" ? "green" : s === "CANCELLED" ? "red" : "yellow");

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Restock inventory from your suppliers"
        action={<Button onClick={openCreate}>+ New Purchase Order</Button>}
      />

      <div className="mb-4 w-48">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : orders.length === 0 ? (
          <EmptyState message="No purchase orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                  <th className="px-4 py-3">PO #</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button className="font-medium text-brand-700 hover:underline" onClick={() => setViewOrder(po)}>
                        {po.poNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{po.supplier?.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor(po.status)}>{po.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{money(po.totalCost)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {po.status === "PENDING" && (
                        <>
                          <button onClick={() => handleReceive(po)} className="text-green-600 hover:underline text-xs mr-3">
                            Receive
                          </button>
                          <button onClick={() => handleCancel(po)} className="text-red-600 hover:underline text-xs">
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <Label>Supplier</Label>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Add Products</Label>
            <Input placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            <div className="max-h-32 overflow-y-auto mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addLine(p)}
                  className="w-full flex justify-between px-3 py-1.5 text-xs text-left hover:bg-slate-50"
                >
                  <span>{p.name}</span>
                  <span className="text-slate-400">{money(p.costPrice)}</span>
                </button>
              ))}
            </div>
          </div>

          {lines.length > 0 && (
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.product.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 truncate">{l.product.name}</div>
                  <input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => updateLine(l.product.id, "quantity", Number(e.target.value))}
                    className="w-16 border border-slate-300 rounded px-1 py-1 text-center text-xs"
                    title="Quantity"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={l.unitCost}
                    onChange={(e) => updateLine(l.product.id, "unitCost", Number(e.target.value))}
                    className="w-20 border border-slate-300 rounded px-1 py-1 text-center text-xs"
                    title="Unit cost"
                  />
                  <button type="button" onClick={() => removeLine(l.product.id)} className="text-red-500 text-xs">
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200">
                <span>Total Cost</span>
                <span>{money(totalCost)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !supplierId || lines.length === 0}>
              {saving ? "Creating..." : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={viewOrder?.poNumber ?? ""}>
        {viewOrder && (
          <div>
            <div className="flex justify-between text-sm text-slate-500 mb-4">
              <span>{viewOrder.supplier?.name}</span>
              <Badge color={statusColor(viewOrder.status)}>{viewOrder.status}</Badge>
            </div>
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-1.5">Item</th>
                  <th className="py-1.5 text-right">Qty</th>
                  <th className="py-1.5 text-right">Unit Cost</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.items.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="py-1.5">{i.product?.name ?? `#${i.productId}`}</td>
                    <td className="py-1.5 text-right">{i.quantity}</td>
                    <td className="py-1.5 text-right">{money(i.unitCost)}</td>
                    <td className="py-1.5 text-right">{money(i.unitCost * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{money(viewOrder.totalCost)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
