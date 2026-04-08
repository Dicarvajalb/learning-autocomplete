/*
  Warnings:

  - You are about to drop the column `questionId` on the `Answer` table. All the data in the column will be lost.
  - The `selectedOrder` column on the `Answer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[sessionId,participantId]` on the table `Answer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Answer_questionId_idx";

-- DropIndex
DROP INDEX "Answer_sessionId_participantId_questionId_key";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "questionId",
DROP COLUMN "selectedOrder",
ADD COLUMN     "selectedOrder" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_participantId_key" ON "Answer"("sessionId", "participantId");
