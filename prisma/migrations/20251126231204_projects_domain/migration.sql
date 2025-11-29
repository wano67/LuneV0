-- CreateTable
CREATE TABLE "account_daily_balance" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "account_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "balance_end_of_day" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_daily_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "business_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "provider" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "include_in_budget" BOOLEAN NOT NULL DEFAULT true,
    "include_in_net_worth" BOOLEAN NOT NULL DEFAULT true,
    "connection_type" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_settings" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" DECIMAL(12,4),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "related_entity_type" VARCHAR(50),
    "related_entity_id" BIGINT,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen_at" TIMESTAMPTZ(6),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "business_id" BIGINT,
    "related_type" VARCHAR(50) NOT NULL,
    "related_id" BIGINT NOT NULL,
    "file_url" TEXT NOT NULL,
    "filename" VARCHAR(255),
    "mime_type" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" BIGSERIAL NOT NULL,
    "budget_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "category_group_id" BIGINT,
    "spending_limit" DECIMAL(12,2),
    "priority" VARCHAR(20),
    "alert_threshold_pct" DECIMAL(5,2) DEFAULT 80,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255),
    "period_type" VARCHAR(20) NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "start_date" DATE,
    "end_date" DATE,
    "scenario" VARCHAR(20) NOT NULL DEFAULT 'base',
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "total_spending_limit" DECIMAL(12,2),
    "include_accounts" JSONB,
    "auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_monthly_summary" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_invoiced_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_invoiced_ttc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_collected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_costs" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_margin_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_margin_pct" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_monthly_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_projects" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "client_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'lead',
    "budget_ht" DECIMAL(12,2),
    "expected_margin_pct" DECIMAL(5,2),
    "start_date" DATE,
    "end_date" DATE,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "business_id" BIGINT NOT NULL,
    "invoice_prefix" VARCHAR(20),
    "invoice_next_number" INTEGER NOT NULL DEFAULT 1,
    "quote_prefix" VARCHAR(20),
    "quote_next_number" INTEGER NOT NULL DEFAULT 1,
    "default_vat_rate" DECIMAL(5,2),
    "default_payment_terms_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "legal_form" VARCHAR(50),
    "registration_number" VARCHAR(100),
    "tax_id" VARCHAR(50),
    "currency" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashflow_projections_monthly" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "scenario" VARCHAR(20) NOT NULL DEFAULT 'base',
    "projection_method" VARCHAR(30),
    "projected_income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "projected_expense" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "projected_saving_in" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "projected_saving_out" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "projected_net_cashflow" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "confidence_pct" DECIMAL(5,2),
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashflow_projections_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "parent_id" BIGINT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "include_in_budget" BOOLEAN NOT NULL DEFAULT true,
    "include_in_reports" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_group_members" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_groups" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_monthly_summary" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "direction" VARCHAR(3) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "nb_transactions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_monthly_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "contact_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "principal_amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "grace_period_days" INTEGER,
    "collateral_description" TEXT,
    "current_balance_cached" DECIMAL(14,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_monthly_summary" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_invoiced_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_invoiced_ttc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_collected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_costs" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_margin_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_margin_pct" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_monthly_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "billing_address" TEXT,
    "shipping_address" TEXT,
    "vat_number" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_clients" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "business_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "company_name" VARCHAR(255),
    "vat_number" VARCHAR(50),
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_rates" (
    "id" BIGSERIAL NOT NULL,
    "base_currency" VARCHAR(10) NOT NULL,
    "quote_currency" VARCHAR(10) NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "rate_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "contact_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "principal_amount" DECIMAL(12,2) NOT NULL,
    "interest_rate" DECIMAL(5,2),
    "start_date" DATE,
    "end_date_expected" DATE,
    "repayment_type" VARCHAR(20),
    "monthly_payment_expected" DECIMAL(12,2),
    "linked_account_id" BIGINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "grace_period_days" INTEGER,
    "collateral_description" TEXT,
    "current_balance_cached" DECIMAL(14,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "source" VARCHAR(50),
    "external_reference" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "imported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_sources" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(30),
    "contact_id" BIGINT,
    "account_id" BIGINT,
    "default_category_id" BIGINT,
    "default_frequency" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_movements" (
    "id" BIGSERIAL NOT NULL,
    "portfolio_id" BIGINT NOT NULL,
    "position_id" BIGINT,
    "date" DATE NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(18,6),
    "price" DECIMAL(12,4),
    "fees" DECIMAL(12,2),
    "cash_amount" DECIMAL(14,2),
    "linked_transaction_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_positions" (
    "id" BIGSERIAL NOT NULL,
    "portfolio_id" BIGINT NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "asset_type" VARCHAR(30),
    "sector" VARCHAR(100),
    "region" VARCHAR(100),
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "avg_cost" DECIMAL(12,4),
    "invested_amount" DECIMAL(14,2),
    "current_price" DECIMAL(12,4),
    "current_value" DECIMAL(14,2),
    "unrealized_pl_amount" DECIMAL(14,2),
    "unrealized_pl_pct" DECIMAL(7,4),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "service_id" BIGINT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" VARCHAR(30),
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "transaction_id" BIGINT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_at" DATE NOT NULL,
    "method" VARCHAR(30),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "project_id" BIGINT,
    "quote_id" BIGINT,
    "invoice_number" VARCHAR(50) NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "currency" VARCHAR(10),
    "payment_terms_days" INTEGER DEFAULT 30,
    "subtotal_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_ttc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_paid_cached" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_summary" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_expense" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_saving_in" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_saving_out" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_cashflow" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_after_saving" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pct_income_spent" DECIMAL(5,2),
    "pct_income_saved" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "debt_id" BIGINT,
    "claim_id" BIGINT,
    "date_due" DATE NOT NULL,
    "principal_due" DECIMAL(12,2) NOT NULL,
    "interest_due" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "transaction_id" BIGINT,
    "paid_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_cashflow" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "scenario" VARCHAR(20) NOT NULL DEFAULT 'base',
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_cashflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_cashflow_lines" (
    "id" BIGSERIAL NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "category_id" BIGINT,
    "category_group_id" BIGINT,
    "income_source_id" BIGINT,
    "direction" VARCHAR(3) NOT NULL,
    "type" VARCHAR(20),
    "label" VARCHAR(255),
    "amount_planned" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_cashflow_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "account_id" BIGINT,
    "type" VARCHAR(30) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "goal" VARCHAR(50),
    "risk_tolerance_override" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_service_lines" (
    "id" BIGSERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "service_id" BIGINT,
    "description" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2),
    "vat_rate" DECIMAL(5,2),
    "discount_pct" DECIMAL(5,2),
    "internal_cost_per_unit" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_service_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "business_id" BIGINT,
    "client_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(30) NOT NULL,
    "start_date" DATE,
    "due_date" DATE,
    "completed_at" TIMESTAMPTZ(6),
    "budget_amount" DECIMAL(12,2),
    "currency" VARCHAR(10) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "progress_manual_pct" INTEGER,
    "progress_auto_mode" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_services" (
    "id" BIGSERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "service_id" BIGINT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "custom_label" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" BIGSERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "due_date" DATE,
    "status" VARCHAR(30) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "weight_pct" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tasks" (
    "id" BIGSERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(30) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "assignee" TEXT,
    "due_date" DATE,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" BIGSERIAL NOT NULL,
    "quote_id" BIGINT NOT NULL,
    "service_id" BIGINT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" VARCHAR(30),
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "project_id" BIGINT,
    "quote_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "valid_until" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "currency" VARCHAR(10),
    "subtotal_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_ttc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_contract_occurrence_transactions" (
    "id" BIGSERIAL NOT NULL,
    "occurrence_id" BIGINT NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "amount_applied" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_contract_occurrence_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_contract_occurrences" (
    "id" BIGSERIAL NOT NULL,
    "contract_id" BIGINT NOT NULL,
    "due_date" DATE NOT NULL,
    "amount_expected" DECIMAL(12,2),
    "amount_paid" DECIMAL(12,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_contract_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_contracts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category_id" BIGINT,
    "account_id" BIGINT,
    "contact_id" BIGINT,
    "amount_expected" DECIMAL(12,2),
    "frequency" VARCHAR(30) NOT NULL,
    "next_due_date" DATE,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "auto_pay" BOOLEAN NOT NULL DEFAULT false,
    "tolerance_pct" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_series" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "category_id" BIGINT,
    "amount_estimated" DECIMAL(12,2),
    "frequency" VARCHAR(30),
    "next_expected_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goal_allocations" (
    "id" BIGSERIAL NOT NULL,
    "goal_id" BIGINT NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_goal_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goal_progress_monthly" (
    "id" BIGSERIAL NOT NULL,
    "goal_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount_saved" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_goal_progress_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "target_date" DATE,
    "priority" VARCHAR(20),
    "linked_account_id" BIGINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "current_amount_cached" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "color" VARCHAR(20),
    "emoji" VARCHAR(10),
    "completed_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(30),
    "billing_mode" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "unit_label" VARCHAR(30),
    "default_price" DECIMAL(12,2),
    "default_vat_rate" DECIMAL(5,2),
    "default_internal_cost" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_services_catalog" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "business_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(30) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_services_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "billing_address" TEXT,
    "vat_number" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_rules" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "match_field" VARCHAR(30) NOT NULL,
    "pattern" TEXT NOT NULL,
    "category_id" BIGINT,
    "income_source_id" BIGINT,
    "set_tags" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "business_id" BIGINT,
    "account_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "direction" VARCHAR(3) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "raw_label" VARCHAR(255),
    "category_id" BIGINT,
    "project_id" BIGINT,
    "contact_id" BIGINT,
    "income_source_id" BIGINT,
    "invoice_id" BIGINT,
    "supplier_id" BIGINT,
    "notes" TEXT,
    "tags" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_series_id" BIGINT,
    "import_source" VARCHAR(50),
    "import_batch_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" BIGINT NOT NULL,
    "main_currency" VARCHAR(10) NOT NULL DEFAULT 'EUR',
    "first_day_of_month" INTEGER NOT NULL DEFAULT 1,
    "risk_tolerance" VARCHAR(20),
    "notification_level" VARCHAR(20),
    "main_goal_type" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_account_daily_balance" ON "account_daily_balance"("account_id", "date");

-- CreateIndex
CREATE INDEX "idx_accounts_business" ON "accounts"("business_id");

-- CreateIndex
CREATE INDEX "idx_accounts_user" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_alert_settings" ON "alert_settings"("user_id", "type");

-- CreateIndex
CREATE INDEX "idx_alerts_user_created" ON "alerts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_attachments_business" ON "attachments"("business_id");

-- CreateIndex
CREATE INDEX "idx_attachments_related" ON "attachments"("related_type", "related_id");

-- CreateIndex
CREATE INDEX "idx_budget_lines_category_group" ON "budget_lines"("category_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_budget_lines" ON "budget_lines"("budget_id", "category_id");

-- CreateIndex
CREATE INDEX "idx_business_monthly_summary_date" ON "business_monthly_summary"("business_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_business_monthly_summary" ON "business_monthly_summary"("business_id", "year", "month");

-- CreateIndex
CREATE INDEX "idx_business_projects_business_status" ON "business_projects"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_business_projects" ON "business_projects"("business_id", "name");

-- CreateIndex
CREATE INDEX "idx_businesses_user_active" ON "businesses"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_businesses" ON "businesses"("user_id", "name");

-- CreateIndex
CREATE INDEX "idx_cashflow_projections_user_date" ON "cashflow_projections_monthly"("user_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cashflow_projections" ON "cashflow_projections_monthly"("user_id", "year", "month", "scenario");

-- CreateIndex
CREATE INDEX "idx_category_group_members_category" ON "category_group_members"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_category_group_members" ON "category_group_members"("group_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_category_groups" ON "category_groups"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_category_monthly_summary" ON "category_monthly_summary"("user_id", "category_id", "year", "month", "direction");

-- CreateIndex
CREATE INDEX "idx_claims_user_status" ON "claims"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_client_monthly_summary_date" ON "client_monthly_summary"("business_id", "client_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_client_monthly_summary" ON "client_monthly_summary"("business_id", "client_id", "year", "month");

-- CreateIndex
CREATE INDEX "idx_clients_business_status" ON "clients"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_clients" ON "clients"("business_id", "name");

-- CreateIndex
CREATE INDEX "idx_project_clients_user_business" ON "project_clients"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "idx_contacts_user_name" ON "contacts"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_currency_rates" ON "currency_rates"("base_currency", "quote_currency", "rate_date");

-- CreateIndex
CREATE INDEX "idx_debts_user_status" ON "debts"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_import_batches_user_imported_at" ON "import_batches"("user_id", "imported_at");

-- CreateIndex
CREATE INDEX "idx_income_sources_user_status" ON "income_sources"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_income_sources" ON "income_sources"("user_id", "name");

-- CreateIndex
CREATE INDEX "idx_investment_movements_portfolio_date" ON "investment_movements"("portfolio_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_investment_positions" ON "investment_positions"("portfolio_id", "symbol");

-- CreateIndex
CREATE INDEX "idx_invoice_lines_invoice" ON "invoice_lines"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_invoice_payments_invoice" ON "invoice_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_invoices_business_client" ON "invoices"("business_id", "client_id");

-- CreateIndex
CREATE INDEX "idx_invoices_business_due_date" ON "invoices"("business_id", "due_date");

-- CreateIndex
CREATE INDEX "idx_invoices_business_status" ON "invoices"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_invoices" ON "invoices"("business_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_monthly_summary" ON "monthly_summary"("user_id", "year", "month");

-- CreateIndex
CREATE INDEX "idx_payment_schedules_user_date_due" ON "payment_schedules"("user_id", "date_due");

-- CreateIndex
CREATE INDEX "idx_payment_schedules_user_status" ON "payment_schedules"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_planned_cashflow_user_date" ON "planned_cashflow"("user_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_planned_cashflow" ON "planned_cashflow"("user_id", "year", "month", "scenario");

-- CreateIndex
CREATE INDEX "idx_planned_cashflow_lines_plan_direction" ON "planned_cashflow_lines"("plan_id", "direction");

-- CreateIndex
CREATE INDEX "idx_project_service_lines_project" ON "project_service_lines"("project_id");

-- CreateIndex
CREATE INDEX "idx_projects_user_business" ON "projects"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "idx_project_services_project" ON "project_services"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_milestones_project" ON "project_milestones"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_tasks_project" ON "project_tasks"("project_id");

-- CreateIndex
CREATE INDEX "idx_quote_lines_quote" ON "quote_lines"("quote_id");

-- CreateIndex
CREATE INDEX "idx_quotes_business_client" ON "quotes"("business_id", "client_id");

-- CreateIndex
CREATE INDEX "idx_quotes_business_status" ON "quotes"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_quotes" ON "quotes"("business_id", "quote_number");

-- CreateIndex
CREATE INDEX "idx_recurring_contract_occurrence_transactions_tx" ON "recurring_contract_occurrence_transactions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_recurring_contract_occurrence_tx" ON "recurring_contract_occurrence_transactions"("occurrence_id", "transaction_id");

-- CreateIndex
CREATE INDEX "idx_recurring_contract_occurrences_contract_date" ON "recurring_contract_occurrences"("contract_id", "due_date");

-- CreateIndex
CREATE INDEX "idx_recurring_contract_occurrences_status" ON "recurring_contract_occurrences"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_recurring_contract_occurrences" ON "recurring_contract_occurrences"("contract_id", "due_date");

-- CreateIndex
CREATE INDEX "idx_recurring_contracts_user_status" ON "recurring_contracts"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_recurring_series_user_active" ON "recurring_series"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_savings_goal_allocations" ON "savings_goal_allocations"("goal_id", "transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_savings_goal_progress" ON "savings_goal_progress_monthly"("goal_id", "year", "month");

-- CreateIndex
CREATE INDEX "idx_savings_goals_user_status" ON "savings_goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_services_business_active" ON "services"("business_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_services" ON "services"("business_id", "name");

-- CreateIndex
CREATE INDEX "idx_project_services_catalog_user_business" ON "project_services_catalog"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "idx_suppliers_business_status" ON "suppliers"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_suppliers" ON "suppliers"("business_id", "name");

-- CreateIndex
CREATE INDEX "idx_transaction_rules_user_active_priority" ON "transaction_rules"("user_id", "is_active", "priority" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_transaction_rules" ON "transaction_rules"("user_id", "name");

-- CreateIndex
CREATE INDEX "idx_transactions_business_date" ON "transactions"("business_id", "date");

-- CreateIndex
CREATE INDEX "idx_transactions_invoice" ON "transactions"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_transactions_supplier_date" ON "transactions"("supplier_id", "date");

-- CreateIndex
CREATE INDEX "idx_transactions_user_category_date" ON "transactions"("user_id", "category_id", "date");

-- CreateIndex
CREATE INDEX "idx_transactions_user_date" ON "transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "idx_transactions_user_income_source_date" ON "transactions"("user_id", "income_source_id", "date");

-- CreateIndex
CREATE INDEX "idx_transactions_project" ON "transactions"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "account_daily_balance" ADD CONSTRAINT "account_daily_balance_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "account_daily_balance" ADD CONSTRAINT "account_daily_balance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_category_group_id_fkey" FOREIGN KEY ("category_group_id") REFERENCES "category_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_monthly_summary" ADD CONSTRAINT "business_monthly_summary_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_projects" ADD CONSTRAINT "business_projects_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_projects" ADD CONSTRAINT "business_projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cashflow_projections_monthly" ADD CONSTRAINT "cashflow_projections_monthly_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_group_members" ADD CONSTRAINT "category_group_members_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_group_members" ADD CONSTRAINT "category_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "category_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_groups" ADD CONSTRAINT "category_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_monthly_summary" ADD CONSTRAINT "category_monthly_summary_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_monthly_summary" ADD CONSTRAINT "category_monthly_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_monthly_summary" ADD CONSTRAINT "client_monthly_summary_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_monthly_summary" ADD CONSTRAINT "client_monthly_summary_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_clients" ADD CONSTRAINT "project_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_clients" ADD CONSTRAINT "project_clients_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_linked_account_id_fkey" FOREIGN KEY ("linked_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_default_category_id_fkey" FOREIGN KEY ("default_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "investment_movements" ADD CONSTRAINT "investment_movements_linked_transaction_id_fkey" FOREIGN KEY ("linked_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "investment_movements" ADD CONSTRAINT "investment_movements_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "investment_movements" ADD CONSTRAINT "investment_movements_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "investment_positions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "investment_positions" ADD CONSTRAINT "investment_positions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "business_projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monthly_summary" ADD CONSTRAINT "monthly_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "planned_cashflow" ADD CONSTRAINT "planned_cashflow_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "planned_cashflow_lines" ADD CONSTRAINT "planned_cashflow_lines_category_group_id_fkey" FOREIGN KEY ("category_group_id") REFERENCES "category_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "planned_cashflow_lines" ADD CONSTRAINT "planned_cashflow_lines_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "planned_cashflow_lines" ADD CONSTRAINT "planned_cashflow_lines_income_source_id_fkey" FOREIGN KEY ("income_source_id") REFERENCES "income_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "planned_cashflow_lines" ADD CONSTRAINT "planned_cashflow_lines_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planned_cashflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_service_lines" ADD CONSTRAINT "project_service_lines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "business_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_service_lines" ADD CONSTRAINT "project_service_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "project_clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_services" ADD CONSTRAINT "project_services_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_services" ADD CONSTRAINT "project_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "project_services_catalog"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "business_projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_contract_occurrence_transactions" ADD CONSTRAINT "recurring_contract_occurrence_transactions_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "recurring_contract_occurrences"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_contract_occurrence_transactions" ADD CONSTRAINT "recurring_contract_occurrence_transactions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_contract_occurrences" ADD CONSTRAINT "recurring_contract_occurrences_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "recurring_contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_contracts" ADD CONSTRAINT "recurring_contracts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_contracts" ADD CONSTRAINT "recurring_contracts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_contracts" ADD CONSTRAINT "recurring_contracts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_contracts" ADD CONSTRAINT "recurring_contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_goal_allocations" ADD CONSTRAINT "savings_goal_allocations_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "savings_goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_goal_allocations" ADD CONSTRAINT "savings_goal_allocations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_goal_progress_monthly" ADD CONSTRAINT "savings_goal_progress_monthly_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "savings_goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_linked_account_id_fkey" FOREIGN KEY ("linked_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_services_catalog" ADD CONSTRAINT "project_services_catalog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_services_catalog" ADD CONSTRAINT "project_services_catalog_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transaction_rules" ADD CONSTRAINT "transaction_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transaction_rules" ADD CONSTRAINT "transaction_rules_income_source_id_fkey" FOREIGN KEY ("income_source_id") REFERENCES "income_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transaction_rules" ADD CONSTRAINT "transaction_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_income_source_id_fkey" FOREIGN KEY ("income_source_id") REFERENCES "income_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_series_id_fkey" FOREIGN KEY ("recurring_series_id") REFERENCES "recurring_series"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
