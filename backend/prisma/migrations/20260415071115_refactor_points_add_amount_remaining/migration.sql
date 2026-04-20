/*
  Warnings:

  - You are about to drop the column `is_used` on the `points` table. All the data in the column will be lost.
  - You are about to drop the column `used_at` on the `points` table. All the data in the column will be lost.
  - Added the required column `amount_remaining` to the `points` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `points` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "points_source_idx";

-- DropIndex
DROP INDEX "points_user_id_is_used_expired_at_idx";

-- AlterTable
ALTER TABLE "points" DROP COLUMN "is_used",
DROP COLUMN "used_at",
ADD COLUMN     "amount_remaining" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "points_user_id_expired_at_idx" ON "points"("user_id", "expired_at");
