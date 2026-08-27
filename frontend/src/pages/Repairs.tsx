import React, { useEffect, useState, useCallback } from "react";
import { RepairsApi, CustomersApi, UsersApi } from "../api/endpoints";
import type { AuthUser, Customer, RepairStatus, RepairTicket } from "../types";
import { Badge, Button, Card, EmptyState, Input, Label, Modal, PageHeader, Select, Textarea, money } from "../components/ui";
import { getApiErrorMessage } from "../api/client";

const statusOptions: RepairStatus[] = [
  "RECEIVED",
  "DIAGNOSING",
  "IN_PROGRESS",
  "AWAITING_PARTS",
  "COMPLETED",
  "PICKED_UP",
  "CANCELLED",
];

const statusColor = (s: RepairStatus) =>
  s === "COMPLETED" || s === "PICKED_UP" ? "green" : s === "CANCELLED" ? "red" : "yellow";

const emptyForm = {
  customerId: "",
  deviceBrand: "",
  deviceModel: "",
  serialNumber: "",
  issueDescription: "",
  estimatedCost: "",
};

export function Repairs() {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<AuthUser[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<RepairTicket | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    RepairsApi.list({ status: statusFilter || undefined })
      .then((res) => setTickets(res.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(load, [load]);

  useEffect(() => {
    CustomersApi.list().then((res) => setCustomers(res.data));
    UsersApi.list()
      .then((res) => setTechnicians(res.data))
      .catch(() => setTechnicians([]));
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await RepairsApi.create({
        customerId: Number(form.customerId),
        deviceBrand: form.deviceBrand,
        deviceModel: form.deviceModel,
        serialNumber: form.serialNumber || null,
        issueDescription: form.issueDescription,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateTicket(t: RepairTicket, patch: Partial<RepairTicket>) {
    try {
      const res = await RepairsApi.update(t.id, patch);
      setDetail(res.data);
      load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Repair Tickets"
        subtitle="Track laptops in for service and repair"
        action={<Button onClick={openCreate}>+ New Ticket</Button>}
      />

      <div className="mb-4 w-56">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <EmptyState message="No repair tickets yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button className="font-medium text-brand-700 hover:underline" onClick={() => setDetail(t)}>
                        {t.ticketNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.customer?.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {t.deviceBrand} {t.deviceModel}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{t.technician?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor(t.status)}>{t.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(t.receivedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Repair Ticket">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <Label>Customer</Label>
            <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Device Brand</Label>
              <Input value={form.deviceBrand} onChange={(e) => setForm({ ...form, deviceBrand: e.target.value })} required />
            </div>
            <div>
              <Label>Device Model</Label>
              <Input value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Serial Number</Label>
            <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          </div>
          <div>
            <Label>Issue Description</Label>
            <Textarea
              rows={3}
              value={form.issueDescription}
              onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Estimated Cost</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedCost}
              onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.ticketNumber ?? ""}>
        {detail && (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium text-slate-800">
                {detail.deviceBrand} {detail.deviceModel}
              </div>
              <div className="text-xs text-slate-400">{detail.customer?.name}</div>
              {detail.serialNumber && <div className="text-xs text-slate-400">S/N: {detail.serialNumber}</div>}
            </div>
            <div className="text-sm bg-slate-50 rounded-lg p-3">{detail.issueDescription}</div>

            <div>
              <Label>Status</Label>
              <Select
                value={detail.status}
                onChange={(e) => updateTicket(detail, { status: e.target.value as RepairStatus })}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Assigned Technician</Label>
              <Select
                value={detail.technicianId ?? ""}
                onChange={(e) =>
                  updateTicket(detail, { technicianId: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estimated Cost</Label>
                <div className="text-sm py-2">{detail.estimatedCost != null ? money(detail.estimatedCost) : "—"}</div>
              </div>
              <div>
                <Label>Final Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={detail.finalCost ?? ""}
                  onBlur={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    if (val !== detail.finalCost) updateTicket(detail, { finalCost: val });
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Technician Notes</Label>
              <Textarea
                rows={3}
                defaultValue={detail.technicianNotes ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (detail.technicianNotes ?? "")) {
                    updateTicket(detail, { technicianNotes: e.target.value });
                  }
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
