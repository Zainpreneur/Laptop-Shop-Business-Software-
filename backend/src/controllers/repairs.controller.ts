import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { nextDocNumber } from "../utils/generateNumber";

const statusEnum = z.enum([
  "RECEIVED",
  "DIAGNOSING",
  "IN_PROGRESS",
  "AWAITING_PARTS",
  "COMPLETED",
  "PICKED_UP",
  "CANCELLED",
]);

const createTicketSchema = z.object({
  customerId: z.coerce.number().int(),
  technicianId: z.coerce.number().int().nullable().optional(),
  deviceBrand: z.string().min(1),
  deviceModel: z.string().min(1),
  serialNumber: z.string().nullable().optional(),
  issueDescription: z.string().min(1),
  estimatedCost: z.coerce.number().min(0).nullable().optional(),
});

const updateTicketSchema = z.object({
  technicianId: z.coerce.number().int().nullable().optional(),
  status: statusEnum.optional(),
  estimatedCost: z.coerce.number().min(0).nullable().optional(),
  finalCost: z.coerce.number().min(0).nullable().optional(),
  technicianNotes: z.string().nullable().optional(),
});

const ticketInclude = {
  customer: true,
  technician: { select: { id: true, name: true } },
};

export async function listRepairTickets(req: Request, res: Response) {
  const { status, customerId } = req.query as { status?: string; customerId?: string };
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerId) where.customerId = Number(customerId);

  const tickets = await prisma.repairTicket.findMany({
    where,
    include: ticketInclude,
    orderBy: { receivedAt: "desc" },
  });
  res.json(tickets);
}

export async function getRepairTicket(req: Request, res: Response) {
  const ticket = await prisma.repairTicket.findUnique({
    where: { id: Number(req.params.id) },
    include: ticketInclude,
  });
  if (!ticket) throw ApiError.notFound("Repair ticket not found");
  res.json(ticket);
}

export async function createRepairTicket(req: Request, res: Response) {
  const data = createTicketSchema.parse(req.body);
  const count = await prisma.repairTicket.count();
  const ticketNumber = nextDocNumber("RT", count);

  const ticket = await prisma.repairTicket.create({
    data: { ...data, ticketNumber },
    include: ticketInclude,
  });
  res.status(201).json(ticket);
}

export async function updateRepairTicket(req: Request, res: Response) {
  const data = updateTicketSchema.parse(req.body);
  const updateData: Record<string, unknown> = { ...data };

  if (data.status === "COMPLETED" || data.status === "PICKED_UP") {
    const existing = await prisma.repairTicket.findUnique({ where: { id: Number(req.params.id) } });
    if (existing && !existing.completedAt) {
      updateData.completedAt = new Date();
    }
  }

  const ticket = await prisma.repairTicket.update({
    where: { id: Number(req.params.id) },
    data: updateData,
    include: ticketInclude,
  });
  res.json(ticket);
}

export async function deleteRepairTicket(req: Request, res: Response) {
  await prisma.repairTicket.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}
