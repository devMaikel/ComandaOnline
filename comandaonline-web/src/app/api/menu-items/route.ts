import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function getUserFromHeader(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

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
      { message: "Apenas administradores podem adicionar itens ao menu" },
      { status: 403 }
    );
  }

  const { name, price, barId } = await req.json();

  if (!name || !price || !barId) {
    return NextResponse.json(
      { message: "Nome, preço e ID do bar são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const bar = await prisma.bar.findUnique({ where: { id: barId } });

    if (!bar || bar.ownerId !== user.id) {
      return NextResponse.json(
        { message: "Bar não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: {
        barId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: "Já existe um item com esse nome no bar" },
        { status: 400 }
      );
    }

    const priceNumber = Number(price);
    if (isNaN(priceNumber)) {
      return NextResponse.json(
        { message: "Preço deve ser um número válido" },
        { status: 400 }
      );
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        price: priceNumber,
        barId,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
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

export async function GET(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const barId = searchParams.get("barId");

    if (!barId) {
      return NextResponse.json(
        { message: "ID do bar é obrigatório" },
        { status: 400 }
      );
    }

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
    });

    if (!bar) {
      return NextResponse.json(
        { message: "Bar não encontrado" },
        { status: 404 }
      );
    }

    const isOwnerAccess = user.role === "OWNER" && bar.ownerId === user.id;
    const isWaiterAccess =
      user.role === "WAITER" && user.ownerId && bar.ownerId === user.ownerId;

    if (!isOwnerAccess && !isWaiterAccess) {
      return NextResponse.json(
        { message: "Acesso negado aos itens desse bar" },
        { status: 403 }
      );
    }

    const items = await prisma.menuItem.findMany({
      where: { barId },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao buscar itens do menu", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  try {
    const { id, name, price } = await req.json();

    if (!id || (!name && price === undefined)) {
      return NextResponse.json(
        { message: "ID e ao menos um campo (nome ou preço) são obrigatórios" },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { bar: true },
    });

    if (!item) {
      return NextResponse.json(
        { message: "Item não encontrado" },
        { status: 404 }
      );
    }

    const isOwnerAccess = user.role === "OWNER" && item.bar.ownerId === user.id;

    if (!isOwnerAccess) {
      return NextResponse.json(
        { message: "Apenas o dono do bar pode editar um item" },
        { status: 403 }
      );
    }

    if (name) {
      const nameExists = await prisma.menuItem.findFirst({
        where: {
          barId: item.barId,
          name,
          NOT: { id }, // evita colisão com ele mesmo
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { message: "Já existe um item com esse nome no bar" },
          { status: 400 }
        );
      }
    }

    const priceNumber = Number(price);
    if (isNaN(priceNumber)) {
      return NextResponse.json(
        { message: "Preço deve ser um número válido" },
        { status: 400 }
      );
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(priceNumber !== undefined && { price: priceNumber }),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao atualizar item", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/menu-items:
 *   post:
 *     summary: Criar um novo item no menu do bar
 *     description: Adiciona um novo item ao menu de um bar. Apenas o dono do bar (OWNER) pode criar itens.
 *     tags:
 *       - MenuItems
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Dados do item do menu a ser criado
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - barId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cerveja artesanal
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 12.5
 *               barId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Item criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Dados inválidos (faltando campos ou nome duplicado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nome, preço e ID do bar são obrigatórios
 *       401:
 *         description: Token inválido ou não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Usuário não tem permissão para criar itens (não é OWNER)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Apenas administradores podem adicionar itens ao menu
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
 *         description: Erro interno ao criar o item
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
 *                   example: Detalhes do erro
 *
 *   get:
 *     summary: Listar itens do menu de um bar
 *     description: Retorna todos os itens do menu de um bar, acessível para donos (OWNER) e garçons (WAITER) autorizados.
 *     tags:
 *       - MenuItems
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barId
 *         required: true
 *         description: ID do bar para buscar os itens
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Lista de itens do menu do bar
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: ID do bar não informado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID do bar é obrigatório
 *       401:
 *         description: Token inválido ou não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Acesso negado para listar itens do bar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Acesso negado aos itens desse bar
 *       404:
 *         description: Bar não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bar não encontrado
 *       500:
 *         description: Erro interno ao buscar itens do menu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao buscar itens do menu
 *                 error:
 *                   type: string
 *                   example: Detalhes do erro
 *
 *   patch:
 *     summary: Atualizar um item do menu
 *     description: Atualiza nome e/ou preço de um item do menu. Apenas o dono do bar pode editar.
 *     tags:
 *       - MenuItems
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Dados para atualização do item do menu
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
 *                 example: b0acb77e-33ea-4125-8f36-dfc88767070f
 *               name:
 *                 type: string
 *                 example: Nova bebida
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 15.75
 *     responses:
 *       200:
 *         description: Item atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Dados inválidos (faltando ID ou nenhum campo para atualizar, ou nome duplicado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID e ao menos um campo (nome ou preço) são obrigatórios
 *       401:
 *         description: Token inválido ou não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Acesso negado para editar item (não é dono do bar)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Apenas o dono do bar pode editar um item
 *       404:
 *         description: Item não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Item não encontrado
 *       500:
 *         description: Erro interno ao atualizar item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao atualizar item
 *                 error:
 *                   type: string
 *                   example: Detalhes do erro
 */
