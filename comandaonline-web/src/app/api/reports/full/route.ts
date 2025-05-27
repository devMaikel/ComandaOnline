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

  // Obter comandas fechadas no período
  const closedCommands = await prisma.command.findMany({
    where: {
      barId,
      status: "CLOSED",
      deletedAt: null,
      updatedAt: {
        gte: startDate,
        lte: now,
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
  const waitersReport: Record<
    string,
    {
      waiterId: string;
      waiterName: string;
      waiterEmail: string;
      totalRevenue: number;
      commandsClosed: number;
    }
  > = {};

  closedCommands.forEach((command) => {
    if (command.closedBy && command.closedById !== null) {
      if (!waitersReport[command.closedById]) {
        waitersReport[command.closedById] = {
          waiterId: command.closedById,
          waiterName: command.closedBy.name || command.closedBy.email,
          waiterEmail: command.closedBy.email,
          totalRevenue: 0,
          commandsClosed: 0,
        };
      }
      waitersReport[command.closedById].totalRevenue += command.total || 0;
      waitersReport[command.closedById].commandsClosed += 1;
    }
  });

  return NextResponse.json({
    period,
    startDate,
    endDate: now,
    totalCommands: closedCommands.length,
    totalRevenue,
    itemsSold,
    salesByProduct: Object.values(salesByProduct),
    waitersReport: Object.values(waitersReport),
  });
}
