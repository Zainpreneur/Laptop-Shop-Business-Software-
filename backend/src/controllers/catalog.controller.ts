import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const nameSchema = z.object({ name: z.string().min(1) });

// --- Brands ---
export async function listBrands(_req: Request, res: Response) {
  res.json(await prisma.brand.findMany({ orderBy: { name: "asc" } }));
}
export async function createBrand(req: Request, res: Response) {
  const { name } = nameSchema.parse(req.body);
  res.status(201).json(await prisma.brand.create({ data: { name } }));
}
export async function deleteBrand(req: Request, res: Response) {
  await prisma.brand.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

// --- Categories ---
export async function listCategories(_req: Request, res: Response) {
  res.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
}
export async function createCategory(req: Request, res: Response) {
  const { name } = nameSchema.parse(req.body);
  res.status(201).json(await prisma.category.create({ data: { name } }));
}
export async function deleteCategory(req: Request, res: Response) {
  await prisma.category.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}
