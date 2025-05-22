import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Token não fornecido" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  const user = await verifyToken(token);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  if (user.role !== "OWNER") {
    return NextResponse.json(
      { message: "Apenas donos de bar podem criar garçons" },
      { status: 403 }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Já existe um usuário com esse e-mail" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newWaiter = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "WAITER",
        ownerId: user.id,
      },
    });

    return NextResponse.json({ user: newWaiter }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao criar garçom", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}
