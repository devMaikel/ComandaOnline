-- DropForeignKey
ALTER TABLE "Command" DROP CONSTRAINT "Command_closedById_fkey";

-- AlterTable
ALTER TABLE "Command" ALTER COLUMN "closedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Command" ADD CONSTRAINT "Command_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
