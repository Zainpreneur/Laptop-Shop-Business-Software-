import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { DashboardApi } from "../api/endpoints";
import type { DashboardSummary } from "../types";
import { Card, PageHeader, Badge, money, EmptyState } from "../components/ui";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </Card>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardApi.summary()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Loading dashboard...</div>;
  if (!data) return <EmptyState message="Could not load dashboard data." />;

  const chartData = data.salesTrend.map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenue,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your laptop shop's performance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Revenue" value={money(data.todayRevenue)} sub={`${data.todaySalesCount} sale(s) today`} />
        <StatCard label="This Month" value={money(data.monthRevenue)} sub={`${data.monthSalesCount} sale(s)`} />
        <StatCard label="30-Day Profit (est.)" value={money(data.last30DaysProfit)} sub={`Revenue: ${money(data.last30DaysRevenue)}`} />
        <StatCard label="Inventory Value" value={money(data.stockValue)} sub={`Retail value: ${money(data.retailValue)}`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Products</div>
          <div className="text-2xl font-semibold mt-1">{data.totalProducts}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Low Stock Alerts</div>
          <div className="text-2xl font-semibold mt-1 text-red-600">{data.lowStockCount}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Open Repairs / Pending POs</div>
          <div className="text-2xl font-semibold mt-1">
            {data.openRepairTickets} <span className="text-slate-300">/</span> {data.pendingPurchaseOrders}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => money(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Selling Products (30d)</h3>
          {data.topProducts.length === 0 ? (
            <EmptyState message="No sales yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                />
                <Tooltip />
                <Bar dataKey="quantity" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Low Stock Products</h3>
          {data.lowStockProducts.length === 0 ? (
            <EmptyState message="All products are well stocked" />
          ) : (
            <div className="space-y-2">
              {data.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.sku}</div>
                  </div>
                  <Badge color="red">{p.stockQuantity} left</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Sales</h3>
          {data.recentSales.length === 0 ? (
            <EmptyState message="No sales yet" />
          ) : (
            <div className="space-y-2">
              {data.recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-slate-800">{s.invoiceNumber}</div>
                    <div className="text-xs text-slate-400">{s.customer?.name ?? "Walk-in customer"}</div>
                  </div>
                  <div className="font-medium">{money(s.total)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
