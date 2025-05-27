import { PrismaClient } from "@prisma/client";
import { getUserFromHeader } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export type SalesByProductReport = {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
};

export async function GET(req: NextRequest) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barId = searchParams.get("barId");
  const period = searchParams.get("period") as "12hours" | "week" | "month";

  if (!barId || !period) {
    return NextResponse.json(
      { message: "Parâmetros barId e period são obrigatórios" },
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
      { message: "Apenas o dono pode acessar relatórios completos" },
      { status: 403 }
    );
  }

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "12hours":
      startDate = new Date(now.setHours(now.getHours() - 12));
      break;
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      return NextResponse.json(
        { message: "Período inválido" },
        { status: 400 }
      );
  }

  const trueNow = new Date();

  console.log("startDate: ", startDate, "endDate: ", now);

  // Obter comandas fechadas no período
  const closedCommands = await prisma.command.findMany({
    where: {
      barId,
      status: "CLOSED",
      deletedAt: null,
      createdAt: {
        gte: startDate,
        lte: trueNow,
      },
    },
    include: {
      items: {
        where: { deletedAt: null },
        include: {
          menuItem: true,
        },
      },
      closedBy: true,
    },
  });

  // Calcular totais gerais
  const totalRevenue = closedCommands.reduce(
    (sum, command) => sum + (command.total || 0),
    0
  );

  const itemsSold = closedCommands.reduce(
    (sum, command) =>
      sum + command.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  // Calcular vendas por produto
  const salesByProduct: Record<string, SalesByProductReport> = {};

  closedCommands.forEach((command) => {
    command.items.forEach((item) => {
      if (!salesByProduct[item.menuItemId]) {
        salesByProduct[item.menuItemId] = {
          productId: item.menuItemId,
          productName: item.menuItem.name,
          quantitySold: 0,
          totalRevenue: 0,
        };
      }
      salesByProduct[item.menuItemId].quantitySold += item.quantity;
      salesByProduct[item.menuItemId].totalRevenue +=
        item.quantity * item.menuItem.price;
    });
  });

  // Calcular relatório por garçom
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
  waiters.push({
    id: user.id,
    name: user.name || user.email,
    email: user.email,
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
            lte: trueNow,
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
            lte: trueNow,
          },
        },
      });

      const commandItems = await prisma.commandItem.findMany({
        where: {
          deletedAt: null,
          command: {
            deletedAt: null,
            createdAt: { gte: startDate, lte: trueNow },
          },
          addedById: waiter.id,
        },
        include: { menuItem: true },
      });

      const allOpenCommands = await prisma.command.findMany({
        where: {
          barId,
          status: "OPEN",
          deletedAt: null,
          createdAt: {
            gte: startDate,
            lte: trueNow,
          },
        },
      });
      console.log(allOpenCommands);
      let itemsSold = 0;
      let totalRevenue = 0;

      commandItems.forEach((item) => {
        console.log(item.commandId);
        const isOpenCommand = allOpenCommands.some(
          (cmd) => cmd.id === item.commandId
        );
        console.log("isOpenCommand", isOpenCommand);
        if (!isOpenCommand) {
          itemsSold += item.quantity;
          totalRevenue += item.quantity * item.menuItem.price;
        }
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

  console.log("waitersReport: ", waitersReport);

  waitersReport.sort(
    (a: { totalRevenue: number }, b: { totalRevenue: number }) =>
      b.totalRevenue - a.totalRevenue
  );

  return NextResponse.json({
    period,
    startDate,
    endDate: trueNow,
    totalCommands: closedCommands.length,
    totalRevenue,
    itemsSold,
    salesByProduct: Object.values(salesByProduct),
    waitersReport: Object.values(waitersReport),
  });
}
