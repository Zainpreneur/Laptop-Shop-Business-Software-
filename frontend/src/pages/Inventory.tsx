import React, { useEffect, useState, useCallback } from "react";
import { ProductsApi, CatalogApi } from "../api/endpoints";
import type { Brand, Category, Condition, Product } from "../types";
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
  Textarea,
  money,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api/client";

const emptyForm = {
  sku: "",
  name: "",
  brandId: "",
  categoryId: "",
  cpu: "",
  ram: "",
  storage: "",
  screenSize: "",
  condition: "NEW" as Condition,
  description: "",
  costPrice: "",
  sellingPrice: "",
  stockQuantity: "",
  reorderLevel: "3",
};

export function Inventory() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    ProductsApi.list({ search: search || undefined, lowStock: lowStockOnly || undefined, pageSize: 100 })
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, [search, lowStockOnly]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    CatalogApi.brands().then((res) => setBrands(res.data));
    CatalogApi.categories().then((res) => setCategories(res.data));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      brandId: p.brandId ? String(p.brandId) : "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      cpu: p.cpu ?? "",
      ram: p.ram ?? "",
      storage: p.storage ?? "",
      screenSize: p.screenSize ?? "",
      condition: p.condition,
      description: p.description ?? "",
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      stockQuantity: String(p.stockQuantity),
      reorderLevel: String(p.reorderLevel),
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        sku: form.sku,
        name: form.name,
        brandId: form.brandId ? Number(form.brandId) : null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        cpu: form.cpu || null,
        ram: form.ram || null,
        storage: form.storage || null,
        screenSize: form.screenSize || null,
        condition: form.condition,
        description: form.description || null,
        costPrice: Number(form.costPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
        stockQuantity: Number(form.stockQuantity) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
      };
      if (editing) {
        await ProductsApi.update(editing.id, payload);
      } else {
        await ProductsApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await ProductsApi.remove(p.id);
      load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${products.length} product(s)`}
        action={isAdmin && <Button onClick={openCreate}>+ Add Product</Button>}
      />

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, SKU, or CPU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : products.length === 0 ? (
          <EmptyState message="No products found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Specs</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400">
                        {p.sku} · {p.brand?.name ?? "—"} · {p.category?.name ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {[p.cpu, p.ram, p.storage, p.screenSize].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={p.condition === "NEW" ? "green" : "yellow"}>{p.condition}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{money(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{money(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge color={p.stockQuantity <= p.reorderLevel ? "red" : "slate"}>
                        {p.stockQuantity}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-brand-600 hover:underline text-xs mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Brand</Label>
              <Select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
                <option value="">—</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CPU</Label>
              <Input value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} />
            </div>
            <div>
              <Label>RAM</Label>
              <Input value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} />
            </div>
            <div>
              <Label>Storage</Label>
              <Input value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} />
            </div>
            <div>
              <Label>Screen Size</Label>
              <Input value={form.screenSize} onChange={(e) => setForm({ ...form, screenSize: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Condition</Label>
            <Select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value as Condition })}
            >
              <option value="NEW">New</option>
              <option value="USED">Used</option>
              <option value="REFURBISHED">Refurbished</option>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cost Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Selling Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input
                type="number"
                min="0"
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
