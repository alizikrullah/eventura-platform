/*
  Warnings:

  - The values [waiting_confirmation,done,rejected] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amount_remaining` on the `points` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `points` table. All the data in the column will be lost.
  - You are about to drop the column `confirmation_expired_at` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_attended` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_proof` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_uploaded_at` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `rejected_reason` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('waiting_payment', 'paid', 'expired', 'canceled');
ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'waiting_payment';
COMMIT;

-- DropIndex
DROP INDEX "points_user_id_amount_remaining_expired_at_idx";

-- DropIndex
DROP INDEX "transactions_status_confirmation_expired_at_idx";

-- AlterTable
ALTER TABLE "points" DROP COLUMN "amount_remaining",
DROP COLUMN "updated_at",
ADD COLUMN     "is_used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "used_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "confirmation_expired_at",
DROP COLUMN "is_attended",
DROP COLUMN "payment_proof",
DROP COLUMN "payment_uploaded_at",
DROP COLUMN "rejected_reason",
ADD COLUMN     "midtrans_order_id" TEXT,
ADD COLUMN     "snap_token" TEXT;

-- CreateIndex
CREATE INDEX "points_user_id_is_used_expired_at_idx" ON "points"("user_id", "is_used", "expired_at");
