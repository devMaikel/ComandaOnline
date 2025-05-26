-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "passwordToken" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tokenSentAt" TIMESTAMP(3);
