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
        where: { ownerId: user.id },
      });
    } else if (user.role === "WAITER" && user.ownerId) {
      bars = await prisma.bar.findMany({
        where: { ownerId: user.ownerId },
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
    const bar = await prisma.bar.findUnique({ where: { id } });

    if (!bar || bar.ownerId !== user.id) {
      return NextResponse.json(
        { message: "Bar não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    const updatedBar = await prisma.bar.update({
      where: { id },
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
    const bar = await prisma.bar.findUnique({ where: { id } });

    if (!bar || bar.ownerId !== user.id) {
      return NextResponse.json(
        { message: "Bar não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    await prisma.bar.delete({ where: { id } });

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
