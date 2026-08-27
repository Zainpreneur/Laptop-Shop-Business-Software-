import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getSummary(_req: Request, res: Response) {
  const now = new Date();
  const startToday = startOfDay(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    todaySales,
    monthSales,
    allActiveSales,
    products,
    openRepairTickets,
    pendingPOs,
    recentSales,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startToday }, status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      include: { items: true },
    }),
    prisma.product.findMany(),
    prisma.repairTicket.count({
      where: { status: { notIn: ["COMPLETED", "PICKED_UP", "CANCELLED"] } },
    }),
    prisma.purchaseOrder.count({ where: { status: "PENDING" } }),
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, items: true },
    }),
  ]);

  // Stock valuation & low stock
  const stockValue = products.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0);
  const retailValue = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);
  const lowStockProducts = products
    .filter((p) => p.stockQuantity <= p.reorderLevel)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 10);

  // Profit estimate over last 30 days (revenue - cost of goods sold)
  const productMap = new Map(products.map((p) => [p.id, p]));
  let cogs30 = 0;
  let revenue30 = 0;
  const revenueByDay = new Map<string, number>();
  const productSalesCount = new Map<number, { name: string; quantity: number; revenue: number }>();

  for (const sale of allActiveSales) {
    revenue30 += sale.total;
    const day = sale.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + sale.total);

    for (const item of sale.items) {
      const product = productMap.get(item.productId);
      if (product) {
        cogs30 += product.costPrice * item.quantity;
      }
      const entry = productSalesCount.get(item.productId) ?? {
        name: product?.name ?? `Product #${item.productId}`,
        quantity: 0,
        revenue: 0,
      };
      entry.quantity += item.quantity;
      entry.revenue += item.lineTotal;
      productSalesCount.set(item.productId, entry);
    }
  }

  const salesTrend: { date: string; revenue: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    salesTrend.push({ date: key, revenue: Math.round((revenueByDay.get(key) ?? 0) * 100) / 100 });
  }

  const topProducts = Array.from(productSalesCount.entries())
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  res.json({
    todayRevenue: todaySales._sum.total ?? 0,
    todaySalesCount: todaySales._count,
    monthRevenue: monthSales._sum.total ?? 0,
    monthSalesCount: monthSales._count,
    last30DaysRevenue: Math.round(revenue30 * 100) / 100,
    last30DaysProfit: Math.round((revenue30 - cogs30) * 100) / 100,
    stockValue: Math.round(stockValue * 100) / 100,
    retailValue: Math.round(retailValue * 100) / 100,
    totalProducts: products.length,
    lowStockCount: products.filter((p) => p.stockQuantity <= p.reorderLevel).length,
    lowStockProducts,
    openRepairTickets,
    pendingPurchaseOrders: pendingPOs,
    salesTrend,
    topProducts,
    recentSales,
  });
}
