import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export type JwtPayload = {
  userId: string;
  iat?: number;
  exp?: number;
};

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
    });

    return user;
  } catch {
    return null;
  }
}

export async function getUserFromHeader(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  return await verifyToken(token);
}
