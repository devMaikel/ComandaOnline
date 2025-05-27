import { getUserFromHeader } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barId = searchParams.get("barId");

  if (!barId) {
    return NextResponse.json(
      { message: "ID do estabelecimento é obrigatório" },
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
  const isWaiterAccess =
    (user.role === "WAITER" || user.role === "MANAGER") &&
    user.ownerId === bar.ownerId;

  if (!isOwnerAccess && !isWaiterAccess) {
    return NextResponse.json(
      { message: "Acesso negado às mesas desse estabelecimento" },
      { status: 403 }
    );
  }

  const tables = await prisma.table.findMany({
    where: { barId, deletedAt: null },
  });
  return NextResponse.json(tables, { status: 200 });
}

export async function POST(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { barId, number } = await req.json();

  if (!barId || !number) {
    return NextResponse.json(
      { message: "ID do bar e número da mesa são obrigatórios" },
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
  const isWaiterAccess =
    (user.role === "WAITER" || user.role === "MANAGER") &&
    user.ownerId === bar.ownerId;

  if (!isOwnerAccess && !isWaiterAccess) {
    return NextResponse.json(
      { message: "Acesso negado para criar mesas nesse estabelecimento" },
      { status: 403 }
    );
  }

  const tableNumber = Number(number);
  if (isNaN(tableNumber)) {
    return NextResponse.json(
      { message: "Numero da mesa deve ser um número válido" },
      { status: 400 }
    );
  }

  const table = await prisma.table.findFirst({
    where: { number: tableNumber, barId, deletedAt: null },
  });

  if (table) {
    return NextResponse.json(
      { message: "Mesa ja existe nesse estabelecimento" },
      { status: 409 }
    );
  }

  const created = await prisma.table.create({
    data: { number: tableNumber, barId },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");

  if (!tableId) {
    return NextResponse.json(
      { message: "tableId é obrigatório" },
      { status: 400 }
    );
  }

  const table = await prisma.table.findUnique({
    where: { id: tableId, deletedAt: null },
    include: { bar: true },
  });

  if (!table || table.deletedAt) {
    return NextResponse.json(
      { message: "Mesa não encontrada" },
      { status: 404 }
    );
  }

  const isOwnerAccess = user.role === "OWNER" && table.bar.ownerId === user.id;

  if (!isOwnerAccess) {
    return NextResponse.json(
      { message: "Apenas o dono do estabelecimento pode deletar mesas" },
      { status: 403 }
    );
  }

  await prisma.table.update({
    where: { id: tableId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(
    { message: "Mesa excluída com sucesso" },
    { status: 200 }
  );
}

/**
 * @swagger
 * /api/tables:
 *   delete:
 *     summary: Exclui uma mesa (soft delete)
 *     description: Remove logicamente uma mesa de um bar. Apenas o dono do bar (OWNER) pode excluir mesas. Requer autenticação.
 *     tags:
 *       - Mesas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tableId
 *         required: true
 *         description: ID da mesa a ser excluída
 *         schema:
 *           type: string
 *           format: uuid
 *           example: table-uuid-1234
 *     responses:
 *       200:
 *         description: Mesa excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mesa excluída com sucesso
 *       400:
 *         description: ID da mesa não fornecido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID da mesa é obrigatório
 *       401:
 *         description: Token JWT inválido ou ausente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Acesso negado. Apenas o dono do bar pode excluir mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Apenas o dono do bar pode deletar mesas
 *       404:
 *         description: Mesa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mesa não encontrada
 */

/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: Lista mesas de um bar
 *     description: Retorna todas as mesas ativas (não deletadas) de um bar específico. Acesso permitido para Owner e Waiter vinculados ao bar.
 *     tags:
 *       - Mesas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do bar para listar as mesas
 *     responses:
 *       200:
 *         description: Lista de mesas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Table'
 *       400:
 *         description: ID do bar não fornecido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID do bar é obrigatório
 *       401:
 *         description: Token JWT inválido ou ausente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Acesso negado às mesas do bar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Acesso negado às mesas desse bar
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
 */

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: Cria uma nova mesa
 *     description: Cria uma nova mesa no bar informado. Acesso permitido para Waiters e Owners do bar. Requer autenticação JWT.
 *     tags:
 *       - Mesas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barId
 *               - number
 *             properties:
 *               barId:
 *                 type: string
 *                 format: uuid
 *                 example: bar-uuid-1234
 *               number:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Mesa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 *       400:
 *         description: Dados inválidos (faltando barId ou number, ou número da mesa não numérico)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Numero da mesa deve ser um número válido
 *       401:
 *         description: Token JWT inválido ou ausente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       403:
 *         description: Acesso negado para criar mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Acesso negado para criar mesas nesse bar
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
 *       409:
 *         description: Mesa já existe no bar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mesa ja existe nesse bar
 */
