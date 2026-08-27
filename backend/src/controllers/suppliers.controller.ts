import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

const supplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export async function listSuppliers(req: Request, res: Response) {
  const { search } = req.query as { search?: string };
  const suppliers = await prisma.supplier.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { contactPerson: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });
  res.json(suppliers);
}

export async function getSupplier(req: Request, res: Response) {
  const id = Number(req.params.id);
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
    },
  });
  if (!supplier) throw ApiError.notFound("Supplier not found");
  res.json(supplier);
}

export async function createSupplier(req: Request, res: Response) {
  const data = supplierSchema.parse(req.body);
  const supplier = await prisma.supplier.create({ data: { ...data, email: data.email || null } });
  res.status(201).json(supplier);
}

export async function updateSupplier(req: Request, res: Response) {
  const data = supplierSchema.partial().parse(req.body);
  const supplier = await prisma.supplier.update({
    where: { id: Number(req.params.id) },
    data: { ...data, email: data.email || undefined },
  });
  res.json(supplier);
}

export async function deleteSupplier(req: Request, res: Response) {
  await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}
