/*
  Warnings:

  - You are about to drop the column `correctOrder` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `partialScoring` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `questionOrder` on the `Question` table. All the data in the column will be lost.
  - Added the required column `description` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `word` to the `QuestionOption` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `label` on the `QuestionOption` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "QuestionOptionLabel" AS ENUM ('HIDE', 'SHOW', 'EXTRA');

-- DropIndex
DROP INDEX "Question_quizId_questionOrder_key";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "correctOrder",
DROP COLUMN "partialScoring",
DROP COLUMN "prompt",
DROP COLUMN "questionOrder",
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuestionOption" ADD COLUMN     "word" TEXT NOT NULL,
DROP COLUMN "label",
ADD COLUMN     "label" "QuestionOptionLabel" NOT NULL;
