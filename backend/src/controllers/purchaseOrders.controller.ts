import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { nextDocNumber } from "../utils/generateNumber";

const poItemSchema = z.object({
  productId: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1),
  unitCost: z.coerce.number().min(0),
});

const createPoSchema = z.object({
  supplierId: z.coerce.number().int(),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
  notes: z.string().nullable().optional(),
});

const poInclude = {
  supplier: true,
  user: { select: { id: true, name: true } },
  items: { include: { product: true } },
};

export async function listPurchaseOrders(req: Request, res: Response) {
  const { status, supplierId } = req.query as { status?: string; supplierId?: string };
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = Number(supplierId);

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: poInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
}

export async function getPurchaseOrder(req: Request, res: Response) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: Number(req.params.id) },
    include: poInclude,
  });
  if (!po) throw ApiError.notFound("Purchase order not found");
  res.json(po);
}

export async function createPurchaseOrder(req: Request, res: Response) {
  const data = createPoSchema.parse(req.body);
  const userId = req.user!.userId;

  const totalCost = data.items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const poCount = await prisma.purchaseOrder.count();
  const poNumber = nextDocNumber("PO", poCount);

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: data.supplierId,
      userId,
      totalCost,
      notes: data.notes ?? null,
      items: {
        create: data.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      },
    },
    include: poInclude,
  });

  res.status(201).json(po);
}

export async function receivePurchaseOrder(req: Request, res: Response) {
  const id = Number(req.params.id);

  const po = await prisma.$transaction(async (tx) => {
    const existing = await tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw ApiError.notFound("Purchase order not found");
    if (existing.status !== "PENDING") {
      throw ApiError.badRequest(`Purchase order is already ${existing.status.toLowerCase()}`);
    }

    for (const item of existing.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { increment: item.quantity },
          costPrice: item.unitCost,
        },
      });
    }

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", receivedAt: new Date() },
      include: poInclude,
    });
  });

  res.json(po);
}

export async function cancelPurchaseOrder(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Purchase order not found");
  if (existing.status !== "PENDING") {
    throw ApiError.badRequest(`Purchase order is already ${existing.status.toLowerCase()}`);
  }
  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: poInclude,
  });
  res.json(po);
}
