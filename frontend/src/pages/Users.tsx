import React, { useEffect, useState, useCallback } from "react";
import { UsersApi } from "../api/endpoints";
import type { AuthUser } from "../types";
import { Badge, Button, Card, EmptyState, Input, Label, Modal, PageHeader, Select } from "../components/ui";
import { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyForm = { name: "", email: "", password: "", role: "STAFF" };

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    UsersApi.list()
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

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
      await UsersApi.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: AuthUser & { active?: boolean }) {
    try {
      await UsersApi.update(u.id, { active: !u.active });
      load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  async function handleDelete(u: AuthUser) {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try {
      await UsersApi.remove(u.id);
      load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage staff and admin accounts"
        action={<Button onClick={openCreate}>+ Add User</Button>}
      />

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : users.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(users as Array<AuthUser & { active?: boolean }>).map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge color={u.role === "ADMIN" ? "blue" : "slate"}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.active ? "green" : "red"}>{u.active ? "Active" : "Disabled"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => toggleActive(u)} className="text-brand-600 hover:underline text-xs mr-3">
                        {u.active ? "Disable" : "Enable"}
                      </button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(u)} className="text-red-600 hover:underline text-xs">
                          Delete
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add User">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Add User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
