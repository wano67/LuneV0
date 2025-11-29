-- AlterTable
ALTER TABLE "business_settings" ADD COLUMN     "monthly_revenue_goal" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "project_clients" ADD COLUMN     "client_id" BIGINT;

-- CreateIndex
CREATE INDEX "idx_project_clients_client" ON "project_clients"("client_id");

-- AddForeignKey
ALTER TABLE "project_clients" ADD CONSTRAINT "project_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
