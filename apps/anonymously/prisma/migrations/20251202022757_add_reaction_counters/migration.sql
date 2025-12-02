/*
  Warnings:

  - A unique constraint covering the columns `[postId,shadowUserId]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `Reaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('AGREE', 'DISAGREE');

-- DropIndex
DROP INDEX "Reaction_postId_shadowUserId_type_key";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "agreeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "disagreeCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "type",
ADD COLUMN     "type" "ReactionType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_shadowUserId_key" ON "Reaction"("postId", "shadowUserId");
