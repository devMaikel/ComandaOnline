import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

async function getUserFromHeader(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return await verifyToken(token);
}

export async function POST(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  if (user.role !== "OWNER") {
    return NextResponse.json(
      { message: "Apenas administradores podem criar bares" },
      { status: 403 }
    );
  }

  const { name } = await req.json();

  if (!name) {
    return NextResponse.json(
      { message: "Nome do bar é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const existingBar = await prisma.bar.findFirst({
      where: {
        name,
        ownerId: user.id,
        deletedAt: null,
      },
    });

    if (existingBar) {
      return NextResponse.json(
        { message: "Você já possui um bar com esse nome" },
        { status: 400 }
      );
    }

    const newBar = await prisma.bar.create({
      data: {
        name,
        ownerId: user.id,
      },
    });

    return NextResponse.json(newBar, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao criar o bar", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  try {
    let bars;

    if (user.role === "OWNER") {
      bars = await prisma.bar.findMany({
        where: { ownerId: user.id, deletedAt: null },
      });
    } else if (user.role === "WAITER" && user.ownerId) {
      bars = await prisma.bar.findMany({
        where: { ownerId: user.ownerId, deletedAt: null },
      });
    } else {
      return NextResponse.json(
        { message: "Permissão negada para acessar os bares" },
        { status: 403 }
      );
    }

    return NextResponse.json(bars, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao buscar bares", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { id, name } = await req.json();

  if (!id || !name) {
    return NextResponse.json(
      { message: "ID e novo nome do bar são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const bar = await prisma.bar.findUnique({ where: { id, deletedAt: null } });

    if (!bar || bar.ownerId !== user.id) {
      return NextResponse.json(
        { message: "Bar não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    const updatedBar = await prisma.bar.update({
      where: { id, deletedAt: null },
      data: { name },
    });

    return NextResponse.json(updatedBar, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao atualizar o bar", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { message: "ID do bar é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const bar = await prisma.bar.findUnique({ where: { id, deletedAt: null } });

    if (!bar || bar.ownerId !== user.id) {
      return NextResponse.json(
        { message: "Bar não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    await prisma.bar.update({ where: { id }, data: { deletedAt: new Date() } });

    return NextResponse.json(
      { message: "Bar deletado com sucesso" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao deletar o bar", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/bars:
 *   post:
 *     summary: Cria um novo bar
 *     description: Apenas usuários com papel OWNER podem criar bares.
 *     tags:
 *       - Bares
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bar do João
 *     responses:
 *       201:
 *         description: Bar criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bar'
 *       400:
 *         description: Nome do bar inválido ou já existente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nome do bar é obrigatório
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Permissão negada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Apenas administradores podem criar bares
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao criar o bar
 *                 error:
 *                   type: string
 *
 *   get:
 *     summary: Lista bares visíveis para o usuário
 *     description: Owners veem seus próprios bares. Waiters veem bares do seu Owner.
 *     tags:
 *       - Bares
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de bares retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bar'
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Permissão negada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Permissão negada para acessar os bares
 *       500:
 *         description: Erro ao buscar bares
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao buscar bares
 *                 error:
 *                   type: string
 *
 *   put:
 *     summary: Atualiza o nome de um bar
 *     tags:
 *       - Bares
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bar atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bar'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID e novo nome do bar são obrigatórios
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       404:
 *         description: Bar não encontrado ou acesso negado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bar não encontrado ou acesso negado
 *       500:
 *         description: Erro ao atualizar o bar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao atualizar o bar
 *                 error:
 *                   type: string
 *
 *   delete:
 *     summary: Deleta um bar
 *     tags:
 *       - Bares
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Bar deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bar deletado com sucesso
 *       400:
 *         description: ID do bar ausente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID do bar é obrigatório
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       404:
 *         description: Bar não encontrado ou acesso negado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bar não encontrado ou acesso negado
 *       500:
 *         description: Erro ao deletar o bar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao deletar o bar
 *                 error:
 *                   type: string
 */
