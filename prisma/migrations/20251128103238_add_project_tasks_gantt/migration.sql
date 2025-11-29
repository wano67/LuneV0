/*
  Warnings:

  - You are about to drop the column `assignee` on the `project_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `order_index` on the `project_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `project_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `project_tasks` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `project_tasks` table. The data in that column could be lost. The data in that column will be cast from `VarChar(30)` to `VarChar(20)`.
  - Added the required column `name` to the `project_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- 1) Ajouter les nouvelles colonnes avec des valeurs compatibles
ALTER TABLE "project_tasks"
  ADD COLUMN "name"            VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN "parent_task_id"  BIGINT,
  ADD COLUMN "start_date"      TIMESTAMPTZ(6),
  ADD COLUMN "completed_at"    TIMESTAMPTZ(6),
  ADD COLUMN "progress_pct"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sort_index"      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estimated_hours" DECIMAL(10,2),
  ADD COLUMN "actual_hours"    DECIMAL(10,2),
  ALTER COLUMN "status" SET DATA TYPE VARCHAR(20),
  ALTER COLUMN "due_date" SET DATA TYPE TIMESTAMPTZ(6);

-- 2) Backfill : recopier les anciennes colonnes dans les nouvelles
UPDATE "project_tasks"
SET
  "name"       = COALESCE("title", CONCAT('Task #', id::text)),
  "sort_index" = COALESCE("order_index", 0);

-- (optionnel) retirer le DEFAULT si tu veux
ALTER TABLE "project_tasks"
  ALTER COLUMN "name" DROP DEFAULT;

-- 3) Supprimer les anciennes colonnes devenues inutiles
ALTER TABLE "project_tasks"
  DROP COLUMN IF EXISTS "title",
  DROP COLUMN IF EXISTS "priority",
  DROP COLUMN IF EXISTS "assignee",
  DROP COLUMN IF EXISTS "order_index";

-- CreateTable
CREATE TABLE "project_task_dependencies" (
    "id" BIGSERIAL NOT NULL,
    "task_id" BIGINT NOT NULL,
    "depends_on" BIGINT NOT NULL,

    CONSTRAINT "project_task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_task_dep_task" ON "project_task_dependencies"("task_id");

-- CreateIndex
CREATE INDEX "idx_task_dep_depends_on" ON "project_task_dependencies"("depends_on");

-- CreateIndex
CREATE INDEX "idx_project_tasks_parent" ON "project_tasks"("parent_task_id");

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_dependencies" ADD CONSTRAINT "project_task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_dependencies" ADD CONSTRAINT "project_task_dependencies_depends_on_fkey" FOREIGN KEY ("depends_on") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
