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
      { message: "Apenas donos de estabelecimento podem criar garçons" },
      { status: 403 }
    );
  }

  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email, deletedAt: null },
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
        name,
        ownerId: user.id,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newWaiter;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
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

/**
 * @swagger
 * /api/users/register-waiter:
 *   post:
 *     summary: Cria um novo garçom (usuário com papel WAITER)
 *     description: Apenas usuários com papel OWNER (donos de bar) podem criar garçons vinculados a si.
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: garcom@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Garçom criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     role:
 *                       type: string
 *                       enum: [OWNER, WAITER]
 *                     ownerId:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: E-mail já existente ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum:
 *                     - Já existe um usuário com esse e-mail
 *                     - Email e senha são obrigatórios
 *       401:
 *         description: Token ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum:
 *                     - Token não fornecido
 *                     - Token inválido
 *       403:
 *         description: Apenas donos podem criar garçons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Apenas donos de bar podem criar garçons
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao criar garçom
 *                 error:
 *                   type: string
 *                   example: Descrição detalhada do erro
 */
