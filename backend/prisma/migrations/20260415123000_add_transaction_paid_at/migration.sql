ALTER TABLE "transactions"
ADD COLUMN "paid_at" TIMESTAMP(3);

UPDATE "transactions"
SET "paid_at" = "updated_at"
WHERE "status" = 'paid'
  AND "paid_at" IS NULL;

CREATE INDEX "transactions_status_paid_at_idx" ON "transactions"("status", "paid_at");