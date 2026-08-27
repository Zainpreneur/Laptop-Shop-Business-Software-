import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { nextDocNumber } from "../utils/generateNumber";

const saleItemSchema = z.object({
  productId: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1),
});

const createSaleSchema = z.object({
  customerId: z.coerce.number().int().nullable().optional(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_MONEY", "OTHER"]).default("CASH"),
  notes: z.string().nullable().optional(),
});

const saleInclude = {
  customer: true,
  user: { select: { id: true, name: true } },
  items: { include: { product: true } },
};

export async function listSales(req: Request, res: Response) {
  const { from, to, customerId, page = "1", pageSize = "20" } = req.query as Record<
    string,
    string | undefined
  >;

  const where: Record<string, unknown> = {};
  if (customerId) where.customerId = Number(customerId);
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: saleInclude,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * size,
      take: size,
    }),
    prisma.sale.count({ where }),
  ]);

  res.json({ data: sales, total, page: pageNum, pageSize: size });
}

export async function getSale(req: Request, res: Response) {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(req.params.id) },
    include: saleInclude,
  });
  if (!sale) throw ApiError.notFound("Sale not found");
  res.json(sale);
}

export async function createSale(req: Request, res: Response) {
  const data = createSaleSchema.parse(req.body);
  const userId = req.user!.userId;

  const sale = await prisma.$transaction(async (tx) => {
    const productIds = data.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    let subtotal = 0;
    const itemsCreate = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw ApiError.badRequest(`Product ${item.productId} not found`);
      }
      if (product.stockQuantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${item.quantity}`
        );
      }
      const lineTotal = product.sellingPrice * item.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        lineTotal,
      };
    });

    const total = Math.max(0, subtotal - data.discount + data.tax);
    const saleCount = await tx.sale.count();
    const invoiceNumber = nextDocNumber("INV", saleCount);

    const createdSale = await tx.sale.create({
      data: {
        invoiceNumber,
        customerId: data.customerId ?? null,
        userId,
        subtotal,
        discount: data.discount,
        tax: data.tax,
        total,
        paymentMethod: data.paymentMethod,
        notes: data.notes ?? null,
        items: { create: itemsCreate },
      },
      include: saleInclude,
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    return createdSale;
  });

  res.status(201).json(sale);
}

export async function cancelSale(req: Request, res: Response) {
  const id = Number(req.params.id);

  const sale = await prisma.$transaction(async (tx) => {
    const existing = await tx.sale.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw ApiError.notFound("Sale not found");
    if (existing.status !== "COMPLETED") {
      throw ApiError.badRequest("Only completed sales can be cancelled");
    }

    // Restock items
    for (const item of existing.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }

    return tx.sale.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: saleInclude,
    });
  });

  res.json(sale);
}
