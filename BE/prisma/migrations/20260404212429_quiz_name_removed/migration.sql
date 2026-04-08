/*
  Warnings:

  - You are about to drop the column `name` on the `Quiz` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Quiz_name_idx";

-- DropIndex
DROP INDEX "Quiz_name_key";

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "name";
