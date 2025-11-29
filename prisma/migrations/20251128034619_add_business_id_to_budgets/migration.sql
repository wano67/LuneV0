-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "business_id" BIGINT,
ADD COLUMN     "currency" VARCHAR(10);

-- CreateIndex
CREATE INDEX "idx_budgets_business" ON "budgets"("business_id");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
