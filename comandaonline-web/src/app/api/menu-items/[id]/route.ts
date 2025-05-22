import { getUserFromHeader } from "../route";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const user = await getUserFromHeader(req);

  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json(
      { message: "ID do item é obrigatório" },
      { status: 400 }
    );
  }

  try {
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
        { message: "Apenas o dono do bar pode deletar um item" },
        { status: 403 }
      );
    }

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json(
      { message: "Item deletado com sucesso" },
      { status: 200 }
    );
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

/**
 * @swagger
 * /api/menu-items/{id}:
 *   delete:
 *     summary: Deletar item do menu
 *     description: Deleta um item do menu pelo seu ID. Apenas o dono do bar pode realizar essa ação.
 *     tags:
 *       - MenuItems
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do item do menu a ser deletado
 *         schema:
 *           type: string
 *           format: uuid
 *           example: b0acb77e-33ea-4125-8f36-dfc88767070f
 *     responses:
 *       200:
 *         description: Item deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Item deletado com sucesso
 *       400:
 *         description: ID do item é obrigatório
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID do item é obrigatório
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
 *         description: Acesso negado — apenas o dono do bar pode deletar o item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Apenas o dono do bar pode deletar um item
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
 *         description: Erro interno do servidor ao deletar o item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao deletar item
 *                 error:
 *                   type: string
 *                   example: Detalhes do erro
 */
