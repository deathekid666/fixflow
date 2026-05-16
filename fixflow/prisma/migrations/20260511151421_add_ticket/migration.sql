/*
  Warnings:

  - You are about to drop the column `deviceModel` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `faultDesc` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticketNumber` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `description` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "deviceModel",
DROP COLUMN "faultDesc",
DROP COLUMN "shopId",
DROP COLUMN "ticketNumber",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'LOW',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN';
