import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  brandId: z.coerce.number().int().nullable().optional(),
  categoryId: z.coerce.number().int().nullable().optional(),
  cpu: z.string().nullable().optional(),
  ram: z.string().nullable().optional(),
  storage: z.string().nullable().optional(),
  screenSize: z.string().nullable().optional(),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]).default("NEW"),
  description: z.string().nullable().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(3),
});

const updateProductSchema = productSchema.partial();

const productInclude = {
  brand: true,
  category: true,
};

export async function listProducts(req: Request, res: Response) {
  const { search, brandId, categoryId, lowStock, page = "1", pageSize = "20" } = req.query as Record<
    string,
    string | undefined
  >;

  const where: Prisma.ProductWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { cpu: { contains: search } },
    ];
  }
  if (brandId) where.brandId = Number(brandId);
  if (categoryId) where.categoryId = Number(categoryId);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));

  let products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  if (lowStock === "true") {
    products = products.filter((p) => p.stockQuantity <= p.reorderLevel);
  }

  const total = products.length;
  const paged = products.slice((pageNum - 1) * size, pageNum * size);

  res.json({ data: paged, total, page: pageNum, pageSize: size });
}

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: productInclude,
  });
  if (!product) throw ApiError.notFound("Product not found");
  res.json(product);
}

export async function createProduct(req: Request, res: Response) {
  const data = productSchema.parse(req.body);
  const product = await prisma.product.create({ data, include: productInclude });
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const data = updateProductSchema.parse(req.body);
  const product = await prisma.product.update({
    where: { id: Number(req.params.id) },
    data,
    include: productInclude,
  });
  res.json(product);
}

export async function deleteProduct(req: Request, res: Response) {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}
