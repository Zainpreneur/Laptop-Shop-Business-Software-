import React, { useEffect, useState, useCallback } from "react";
import { SuppliersApi } from "../api/endpoints";
import type { Supplier } from "../types";
import { Badge, Button, Card, EmptyState, Input, Label, Modal, PageHeader, money } from "../components/ui";
import { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyForm = { name: "", contactPerson: "", email: "", phone: "", address: "" };

export function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    SuppliersApi.list(search || undefined)
      .then((res) => setSuppliers(res.data))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      address: s.address ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function viewDetail(s: Supplier) {
    const res = await SuppliersApi.get(s.id);
    setDetail(res.data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await SuppliersApi.update(editing.id, form);
      } else {
        await SuppliersApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Supplier) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    try {
      await SuppliersApi.remove(s.id);
      load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} supplier(s)`}
        action={isAdmin && <Button onClick={openCreate}>+ Add Supplier</Button>}
      />

      <div className="mb-4 w-full sm:w-72">
        <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : suppliers.length === 0 ? (
          <EmptyState message="No suppliers yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Contact</th>
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button className="font-medium text-brand-700 hover:underline" onClick={() => viewDetail(s)}>
                        {s.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.contactPerson ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {s.email ?? "—"} <br /> {s.phone ?? "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(s)} className="text-brand-600 hover:underline text-xs mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s)} className="text-red-600 hover:underline text-xs">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Supplier" : "Add Supplier"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""}>
        {detail && (
          <div>
            <div className="text-sm text-slate-500 mb-4">
              {detail.contactPerson ?? "—"} · {detail.email ?? "—"} · {detail.phone ?? "—"}
            </div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Purchase Orders</h4>
            {!detail.purchaseOrders?.length ? (
              <EmptyState message="No purchase orders yet." />
            ) : (
              <div className="space-y-1">
                {detail.purchaseOrders.map((po) => (
                  <div key={po.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                    <span>{po.poNumber}</span>
                    <span className="flex items-center gap-2">
                      {money(po.totalCost)}
                      <Badge color={po.status === "RECEIVED" ? "green" : po.status === "CANCELLED" ? "red" : "yellow"}>
                        {po.status}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
