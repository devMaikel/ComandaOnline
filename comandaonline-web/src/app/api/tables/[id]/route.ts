import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromHeader(req);
  if (!user) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const { id } = params;

  const table = await prisma.table.findUnique({
    where: { id, deletedAt: null },
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
      { message: "Apenas o dono do bar pode deletar mesas" },
      { status: 403 }
    );
  }

  await prisma.table.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(
    { message: "Mesa excluída com sucesso" },
    { status: 200 }
  );
}

/**
 * @swagger
 * /api/tables/{id}:
 *   delete:
 *     summary: Exclui uma mesa (soft delete)
 *     description: Remove logicamente uma mesa de um bar. Apenas o dono do bar (OWNER) pode excluir mesas. Requer autenticação.
 *     tags:
 *       - Mesas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
