-- CreateTable
CREATE TABLE "shared_expenses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_expense_participants" (
    "id" BIGSERIAL NOT NULL,
    "shared_expense_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "share_amount" DECIMAL(12,2) NOT NULL,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_expense_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_expense_settlements" (
    "id" BIGSERIAL NOT NULL,
    "shared_expense_id" BIGINT NOT NULL,
    "from_name" VARCHAR(255) NOT NULL,
    "to_name" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_expense_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_shared_expenses_user_date" ON "shared_expenses"("user_id", "date");

-- CreateIndex
CREATE INDEX "idx_shared_expense_participants_expense" ON "shared_expense_participants"("shared_expense_id");

-- CreateIndex
CREATE INDEX "idx_shared_expense_settlements_expense_date" ON "shared_expense_settlements"("shared_expense_id", "date");

-- AddForeignKey
ALTER TABLE "shared_expenses" ADD CONSTRAINT "shared_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shared_expense_participants" ADD CONSTRAINT "shared_expense_participants_shared_expense_id_fkey" FOREIGN KEY ("shared_expense_id") REFERENCES "shared_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shared_expense_settlements" ADD CONSTRAINT "shared_expense_settlements_shared_expense_id_fkey" FOREIGN KEY ("shared_expense_id") REFERENCES "shared_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
