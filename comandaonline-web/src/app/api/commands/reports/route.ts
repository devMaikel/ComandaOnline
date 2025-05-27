import { PrismaClient } from "@prisma/client";
import { getUserFromHeader } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// api/commands/reports?barId=<BAR_ID>&period=month
// GET /api/commands/reports?barId=<BAR_ID>&period=week
// GET /api/commands/reports?barId=<BAR_ID>&period=12hours
// GET /api/commands/reports?barId=<BAR_ID>&period=custom&start=2023-10-01
export async function GET(req: NextRequest) {
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barId = searchParams.get("barId");
  const period = searchParams.get("period") || "week"; // week, month ou custom

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
  if (!isOwnerAccess) {
    return NextResponse.json(
      { message: "Apenas o dono pode acessar relatórios" },
      { status: 403 }
    );
  }

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "12hours":
      startDate = new Date(now.setHours(now.getHours() - 12));
      break;
    case "custom":
      const customStart = searchParams.get("start");
      if (!customStart) {
        return NextResponse.json(
          { message: "Parâmetro 'start' é obrigatório para período custom" },
          { status: 400 }
        );
      }
      startDate = new Date(customStart);
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7)); // padrão: última semana
  }

  const closedCommands = await prisma.command.findMany({
    where: {
      barId,
      status: "CLOSED",
      deletedAt: null,
      updatedAt: {
        gte: startDate,
        lte: new Date(),
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      table: true,
      items: {
        where: { deletedAt: null },
        include: {
          menuItem: true,
        },
      },
    },
  });

  const totalRevenue = closedCommands.reduce(
    (sum, command) => sum + (command.total || 0),
    0
  );

  const itemsSold = closedCommands.reduce(
    (sum, command) =>
      sum + command.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return NextResponse.json({
    period,
    startDate,
    endDate: new Date(),
    totalCommands: closedCommands.length,
    totalRevenue,
    itemsSold,
    commands: closedCommands,
  });
}
