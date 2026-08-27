import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export async function listCustomers(req: Request, res: Response) {
  const { search } = req.query as { search?: string };
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });
  res.json(customers);
}

export async function getCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
      repairTickets: { orderBy: { receivedAt: "desc" }, take: 20 },
    },
  });
  if (!customer) throw ApiError.notFound("Customer not found");
  res.json(customer);
}

export async function createCustomer(req: Request, res: Response) {
  const data = customerSchema.parse(req.body);
  const customer = await prisma.customer.create({ data: { ...data, email: data.email || null } });
  res.status(201).json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const data = customerSchema.partial().parse(req.body);
  const customer = await prisma.customer.update({
    where: { id: Number(req.params.id) },
    data: { ...data, email: data.email || undefined },
  });
  res.json(customer);
}

export async function deleteCustomer(req: Request, res: Response) {
  await prisma.customer.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}
