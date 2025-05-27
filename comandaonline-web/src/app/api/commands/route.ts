import { PrismaClient } from "@prisma/client";
import { getUserFromHeader } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const body = await req.json();
  const { tableId } = body;

  if (!tableId) {
    return NextResponse.json(
      { message: "O campo tableId é obrigatório" },
      { status: 400 }
    );
  }

  const table = await prisma.table.findUnique({
    where: { id: tableId, deletedAt: null },
    include: { bar: true },
  });

  if (!table) {
    return NextResponse.json(
      { message: "Mesa não encontrada" },
      { status: 404 }
    );
  }

  const bar = table.bar;

  const isOwnerAccess = user.role === "OWNER" && bar.ownerId === user.id;
  const isWaiterAccess = user.role === "WAITER" && user.ownerId === bar.ownerId;

  if (!isOwnerAccess && !isWaiterAccess) {
    return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
  }

  const alreadyOpenCommand = await prisma.command.findFirst({
    where: {
      tableId,
      status: "OPEN",
      deletedAt: null,
    },
  });

  if (alreadyOpenCommand) {
    return NextResponse.json(
      { message: "Já existe uma comanda aberta para essa mesa" },
      { status: 409 }
    );
  }

  const command = await prisma.command.create({
    data: {
      tableId: table.id,
      barId: bar.id,
      openedById: user.id,
      status: "OPEN",
      publicHash: nanoid(10),
    },
  });

  return NextResponse.json(command, { status: 201 });
}

// export async function GET(req: NextRequest) {
//   const user = await getUserFromHeader(req);

//   if (!user) {
//     return NextResponse.json({ message: "Token inválido" }, { status: 401 });
//   }

//   const { searchParams } = new URL(req.url);
//   const barId = searchParams.get("barId");

//   if (!barId) {
//     return NextResponse.json(
//       { message: "O parâmetro barId é obrigatório" },
//       { status: 400 }
//     );
//   }

//   const bar = await prisma.bar.findUnique({
//     where: { id: barId, deletedAt: null },
//   });

//   if (!bar) {
//     return NextResponse.json(
//       { message: "Bar não encontrado" },
//       { status: 404 }
//     );
//   }

//   const isOwnerAccess = user.role === "OWNER" && bar.ownerId === user.id;
//   const isWaiterAccess = user.role === "WAITER" && user.ownerId === bar.ownerId;

//   if (!isOwnerAccess && !isWaiterAccess) {
//     return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
//   }

//   const commands = await prisma.command.findMany({
//     where: {
//       barId,
//       deletedAt: null,
//       status: "OPEN",
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//     include: {
//       table: true,
//       openedBy: {
//         select: { id: true, email: true },
//       },
//       closedBy: {
//         select: { id: true, email: true },
//       },
//       items: {
//         where: { deletedAt: null },
//         include: {
//           menuItem: true,
//           addedBy: {
//             select: { id: true, email: true },
//           },
//         },
//       },
//     },
//   });

//   return NextResponse.json(commands);
// }

export async function GET(req: NextRequest) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barId = searchParams.get("barId");
  const status = searchParams.get("status") || "OPEN";

  if (!barId) {
    return NextResponse.json(
      { message: "O parâmetro barId é obrigatório" },
      { status: 400 }
    );
  }

  const bar = await prisma.bar.findUnique({
    where: { id: barId, deletedAt: null },
  });

  if (!bar) {
    return NextResponse.json(
      { message: "Bar não encontrado" },
      { status: 404 }
    );
  }

  const isOwnerAccess = user.role === "OWNER" && bar.ownerId === user.id;
  const isWaiterAccess = user.role === "WAITER" && user.ownerId === bar.ownerId;

  if (!isOwnerAccess && !isWaiterAccess) {
    return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
  }

  if (status !== "OPEN" && status !== "CLOSED") {
    return NextResponse.json(
      { message: "Status deve ser OPEN ou CLOSED" },
      { status: 400 }
    );
  }

  const commands = await prisma.command.findMany({
    where: {
      barId,
      deletedAt: null,
      status: status as "OPEN" | "CLOSED",
    },
    orderBy: {
      createdAt: status === "OPEN" ? "desc" : "desc",
    },
    include: {
      table: true,
      openedBy: {
        select: { id: true, email: true },
      },
      closedBy:
        status === "CLOSED" ? { select: { id: true, email: true } } : undefined,
      items: {
        where: { deletedAt: null },
        include: {
          menuItem: true,
          addedBy: {
            select: { id: true, email: true },
          },
        },
      },
    },
  });

  return NextResponse.json(commands);
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const commandId = req.nextUrl.searchParams.get("commandId");

  if (!commandId) {
    return NextResponse.json(
      { message: "Parâmetro commandId é obrigatório" },
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
          "Apenas o dono ou um garçom do estabelecimento pode fechar a comanda",
      },
      { status: 403 }
    );
  }

  const updated = await prisma.command.update({
    where: { id: commandId },
    data: {
      status: "CLOSED",
      closedById: user.id,
    },
  });

  return NextResponse.json(updated, { status: 200 });
}

/**
 * @swagger
 * /api/commands:
 *   post:
 *     summary: Criar uma nova comanda
 *     description: Cria uma nova comanda para uma mesa específica, desde que o usuário tenha permissão (OWNER ou WAITER).
 *     tags:
 *       - Commands
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Dados para criação da comanda
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableId
 *             properties:
 *               tableId:
 *                 type: string
 *                 format: uuid
 *                 example: "abcd1234-5678-90ef-ghij-klmnopqrstuv"
 *     responses:
 *       201:
 *         description: Comanda criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Command'
 *       400:
 *         description: Campo tableId ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "O campo tableId é obrigatório"
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token inválido"
 *       403:
 *         description: Acesso negado (usuário sem permissão)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Acesso negado"
 *       404:
 *         description: Mesa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mesa não encontrada"
 *       409:
 *         description: Já existe uma comanda aberta para essa mesa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Já existe uma comanda aberta para essa mesa"
 *
 *   get:
 *     summary: Listar todas as comandas abertas de um bar
 *     description: Retorna todas as comandas com status "OPEN" para o bar especificado, acessível apenas pelo OWNER ou WAITER do bar.
 *     tags:
 *       - Commands
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do bar para filtrar as comandas
 *     responses:
 *       200:
 *         description: Lista de comandas abertas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Command'
 *       400:
 *         description: Parâmetro barId ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "O parâmetro barId é obrigatório"
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token inválido"
 *       403:
 *         description: Acesso negado (usuário sem permissão)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Acesso negado"
 *       404:
 *         description: Bar não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bar não encontrado"
 *
 *   patch:
 *     summary: Fechar uma comanda
 *     description: Altera o status da comanda para "CLOSED" e registra o usuário que fechou a comanda.
 *     tags:
 *       - Commands
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: commandId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da comanda a ser fechada
 *     responses:
 *       200:
 *         description: Comanda fechada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Command'
 *       400:
 *         description: Comanda já está fechada ou parâmetro ausente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "Parâmetro commandId é obrigatório"
 *                     - "Comanda já está fechada"
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token inválido"
 *       403:
 *         description: Acesso negado (apenas OWNER ou WAITER do bar)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Apenas o dono ou um garçom do bar pode fechar a comanda"
 *       404:
 *         description: Comanda não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comanda não encontrada"
 */
