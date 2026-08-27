import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
};

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ select: userSelect, orderBy: { id: "asc" } });
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const data = createUserSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, role: data.role, passwordHash },
    select: userSelect,
  });
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = updateUserSchema.parse(req.body);

  const updateData: Record<string, unknown> = {
    name: data.name,
    role: data.role,
    active: data.active,
  };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });
  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (id === req.user!.userId) {
    throw ApiError.badRequest("You cannot delete your own account");
  }
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}
