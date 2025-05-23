import { PrismaClient } from "@prisma/client";
import { getUserFromHeader } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromHeader(req);

    if (!user) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const body = await req.json();
    const { commandId, menuItemId, quantity, notes } = body;

    if (!commandId || !menuItemId || !quantity) {
      return NextResponse.json(
        { message: "Campos obrigatórios: commandId, menuItemId, quantity" },
        { status: 400 }
      );
    }

    const command = await prisma.command.findUnique({
      where: { id: commandId, deletedAt: null },
      include: { bar: true },
    });

    if (!command) {
      return NextResponse.json(
        { message: "Comanda não encontrada" },
        { status: 404 }
      );
    }

    if (command.status === "CLOSED") {
      return NextResponse.json(
        { message: "Comanda já está fechada" },
        { status: 400 }
      );
    }

    const isOwnerAccess =
      user.role === "OWNER" && command.bar.ownerId === user.id;
    const isWaiterAccess =
      user.role === "WAITER" && user.ownerId === command.bar.ownerId;

    if (!isOwnerAccess && !isWaiterAccess) {
      return NextResponse.json(
        {
          message:
            "Acesso negado, a comanda não pertence a um bar que você tem acesso.",
        },
        { status: 403 }
      );
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId, deletedAt: null, barId: command.barId },
    });

    if (!menuItem) {
      return NextResponse.json(
        { message: "Item do cardápio não encontrado" },
        { status: 404 }
      );
    }

    const createdItem = await prisma.commandItem.create({
      data: {
        commandId,
        menuItemId,
        quantity,
        notes,
        addedById: user.id,
      },
    });

    const commandItems = await prisma.commandItem.findMany({
      where: { commandId, deletedAt: null },
      include: { menuItem: true },
    });

    const newTotal = commandItems.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );

    await prisma.command.update({
      where: { id: commandId },
      data: { total: newTotal },
    });

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao adicionar item à comanda", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromHeader(req);
    if (!user) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, commandId } = body;

    if (!itemId || !commandId) {
      return NextResponse.json(
        { message: "Campos obrigatórios: itemId e commandId" },
        { status: 400 }
      );
    }

    const item = await prisma.commandItem.findUnique({
      where: { id: itemId, deletedAt: null },
      include: {
        command: {
          include: { bar: true },
        },
      },
    });

    if (
      !item ||
      item.commandId !== commandId ||
      item.command.deletedAt !== null
    ) {
      return NextResponse.json(
        { message: "Item não encontrado ou não pertence à comanda" },
        { status: 404 }
      );
    }

    const isOwner =
      user.role === "OWNER" && item.command.bar.ownerId === user.id;
    const isWaiter =
      user.role === "WAITER" && user.ownerId === item.command.bar.ownerId;

    if (!isOwner && !isWaiter) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    await prisma.commandItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });

    const commandItems = await prisma.commandItem.findMany({
      where: { commandId, deletedAt: null },
      include: { menuItem: true },
    });

    const newTotal = commandItems.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );

    await prisma.command.update({
      where: { id: commandId },
      data: { total: newTotal },
    });

    return NextResponse.json({ message: "Item excluído com sucesso" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao deletar item", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ message: "Erro desconhecido" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromHeader(req);
    if (!user) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const itemId = req.nextUrl.searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json(
        { message: "Parâmetro itemId é obrigatório" },
        { status: 400 }
      );
    }

    const item = await prisma.commandItem.findUnique({
      where: { id: itemId, deletedAt: null },
      include: { command: { include: { bar: true } } },
    });

    if (!item) {
      return NextResponse.json(
        { message: "Item não encontrado" },
        { status: 404 }
      );
    }

    const isOwner =
      user.role === "OWNER" && item.command.bar.ownerId === user.id;
    const isWaiter =
      user.role === "WAITER" && user.ownerId === item.command.bar.ownerId;

    if (!isOwner && !isWaiter) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const { quantity, notes } = body;

    const updated = await prisma.commandItem.update({
      where: { id: itemId },
      data: {
        quantity,
        notes,
      },
    });

    return NextResponse.json(updated);
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
 * /api/command-item:
 *   post:
 *     summary: Adiciona um item à comanda
 *     description: Cria um novo item de consumo vinculado a uma comanda aberta.
 *     tags:
 *       - CommandItem
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommandItemCreateRequest'
 *     responses:
 *       201:
 *         description: Item criado com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes ou comanda já está fechada
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado à comanda
 *       404:
 *         description: Comanda ou item do cardápio não encontrado
 *       500:
 *         description: Erro ao adicionar item à comanda
 */

/**
 * @swagger
 * /api/command-item:
 *   delete:
 *     summary: Remove um item da comanda
 *     description: Marca um item como excluído e atualiza o total da comanda.
 *     tags:
 *       - CommandItem
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - commandId
 *             properties:
 *               itemId:
 *                 type: string
 *               commandId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item excluído com sucesso
 *       400:
 *         description: Campos obrigatórios itemId e commandId são obrigatórios
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Item não encontrado ou não pertence à comanda
 *       500:
 *         description: Erro ao deletar item
 */

/**
 * @swagger
 * /api/command-item:
 *   patch:
 *     summary: Atualiza um item da comanda
 *     description: Atualiza a quantidade e/ou observações de um item de consumo.
 *     tags:
 *       - CommandItem
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do item a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommandItemUpdateRequest'
 *     responses:
 *       200:
 *         description: Item atualizado com sucesso
 *       400:
 *         description: Parâmetro itemId é obrigatório
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Item não encontrado
 *       500:
 *         description: Erro ao atualizar item
 */
