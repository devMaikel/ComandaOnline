import { PrismaClient } from "@prisma/client";
import { getUserFromHeader } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/waiters/reports?barId=<BAR_ID>&period=week
// GET /api/waiters/reports?barId=<BAR_ID>&period=month
// GET /api/waiters/reports?barId=<BAR_ID>&period=custom&start=2023-10-01&end=2023-10-31
export async function GET(req: NextRequest) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barId = searchParams.get("barId");
  const period = searchParams.get("period") || "week";
  const start = searchParams.get("start");
  const end = searchParams.get("end");

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

  if (user.role !== "OWNER" || bar.ownerId !== user.id) {
    return NextResponse.json(
      { message: "Apenas o dono pode acessar relatórios de garçons" },
      { status: 403 }
    );
  }

  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date();

  switch (period) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "custom":
      if (!start || !end) {
        return NextResponse.json(
          {
            message:
              "Parâmetros 'start' e 'end' são obrigatórios para período custom",
          },
          { status: 400 }
        );
      }
      startDate = new Date(start);
      endDate = new Date(end);
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7));
  }

  const waiters = await prisma.user.findMany({
    where: {
      ownerId: bar.ownerId,
      role: "WAITER",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const waitersReport = await Promise.all(
    waiters.map(async (waiter) => {
      const openCommands = await prisma.command.findMany({
        where: {
          barId,
          openedById: waiter.id,
          deletedAt: null,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const closedCommands = await prisma.command.findMany({
        where: {
          barId,
          closedById: waiter.id,
          deletedAt: null,
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: {
            where: { deletedAt: null },
            include: {
              menuItem: true,
            },
          },
        },
      });

      let itemsSold = 0;
      let totalRevenue = 0;

      closedCommands.forEach((command) => {
        command.items.forEach((item) => {
          itemsSold += item.quantity;
          totalRevenue += item.quantity * item.menuItem.price;
        });
      });

      return {
        waiterId: waiter.id,
        waiterName: waiter.name || waiter.email,
        waiterEmail: waiter.email,
        openCommandsCount: openCommands.length,
        closedCommandsCount: closedCommands.length,
        itemsSold,
        totalRevenue,
      };
    })
  );

  return NextResponse.json({
    period,
    startDate,
    endDate,
    waiters: waitersReport,
  });
}

/**
 * @swagger
 * /api/waiters/reports:
 *   get:
 *     summary: Relatório de desempenho dos garçons
 *     description: Retorna estatísticas de vendas por garçom em um período específico
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do bar
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, custom]
 *           default: week
 *         description: Período do relatório (week, month ou custom)
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início (obrigatório para período custom)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim (obrigatório para período custom)
 *     responses:
 *       200:
 *         description: Relatório retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 waiters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       waiterId:
 *                         type: string
 *                       waiterName:
 *                         type: string
 *                       waiterEmail:
 *                         type: string
 *                       openCommandsCount:
 *                         type: integer
 *                       closedCommandsCount:
 *                         type: integer
 *                       itemsSold:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas para donos)
 *       404:
 *         description: Bar não encontrado
 */
