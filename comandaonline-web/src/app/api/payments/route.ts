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
    const { commandId, amount, paymentType, note } = body;

    if (!commandId || !amount) {
      return NextResponse.json(
        { message: "Campos obrigatórios: commandId, amount" },
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

    const isOwnerAccess =
      user.role === "OWNER" && command.bar.ownerId === user.id;
    const isWaiterAccess =
      (user.role === "WAITER" || user.role === "MANAGER") &&
      user.ownerId === command.bar.ownerId;

    if (!isOwnerAccess && !isWaiterAccess) {
      return NextResponse.json(
        { message: "Acesso negado à comanda" },
        { status: 403 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        commandId,
        amount,
        paymentType: paymentType || "CASH",
        note,
        paidById: user.id,
      },
    });

    const updatedCommand = await prisma.command.update({
      where: { id: commandId },
      data: {
        paidAmount: { increment: amount },
        remainingAmount: { decrement: amount },
      },
      include: {
        payments: true,
      },
    });

    if (updatedCommand.remainingAmount <= 0 && command.status === "OPEN") {
      await prisma.command.update({
        where: { id: commandId },
        data: {
          status: "CLOSED",
          closedById: user.id,
        },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao registrar pagamento", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Erro desconhecido ao registrar pagamento" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
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

    // Verifica se o usuário tem acesso à comanda
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

    const isOwner = user.role === "OWNER" && command.bar.ownerId === user.id;
    const isWaiter =
      (user.role === "WAITER" || user.role === "MANAGER") &&
      user.ownerId === command.bar.ownerId;

    if (!isOwner && !isWaiter) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    // Retorna todos os pagamentos da comanda
    const payments = await prisma.payment.findMany({
      where: { commandId },
      orderBy: { createdAt: "desc" },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(payments);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro ao buscar pagamentos", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Erro desconhecido ao buscar pagamentos" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Adiciona um pagamento a uma comanda
 *     description: Registra um novo pagamento e atualiza os valores totais da comanda.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commandId
 *               - amount
 *             properties:
 *               commandId:
 *                 type: string
 *                 description: ID da comanda
 *               amount:
 *                 type: number
 *                 description: Valor do pagamento
 *               paymentType:
 *                 type: string
 *                 enum: [CASH, CREDIT_CARD, DEBIT_CARD, PIX, OTHER]
 *                 default: CASH
 *               note:
 *                 type: string
 *                 description: Observação sobre o pagamento
 *     responses:
 *       201:
 *         description: Pagamento registrado com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado à comanda
 *       404:
 *         description: Comanda não encontrada
 *       500:
 *         description: Erro ao registrar pagamento
 *
 *   get:
 *     summary: Lista pagamentos de uma comanda
 *     description: Retorna todos os pagamentos registrados para uma comanda específica.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: commandId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da comanda
 *     responses:
 *       200:
 *         description: Lista de pagamentos retornada com sucesso
 *       400:
 *         description: Parâmetro commandId ausente
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Comanda não encontrada
 *       500:
 *         description: Erro ao buscar pagamentos
 */
