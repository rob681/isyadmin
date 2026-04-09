-- CreateEnum for AccountType
CREATE TYPE "iadm_account_type" AS ENUM ('DEBIT_CARD', 'CREDIT_CARD', 'SAVINGS', 'CHECKING', 'CASH');

-- AlterTable: FinancialAccount
-- First, add a temporary column
ALTER TABLE "iadm_financial_account" ADD COLUMN "accountType_new" "iadm_account_type";

-- Copy existing data: try to map string values, default to DEBIT_CARD if unknown
UPDATE "iadm_financial_account"
SET "accountType_new" = CASE
  WHEN "accountType" = 'DEBIT_CARD' THEN 'DEBIT_CARD'::"iadm_account_type"
  WHEN "accountType" = 'CREDIT_CARD' THEN 'CREDIT_CARD'::"iadm_account_type"
  WHEN "accountType" = 'SAVINGS' THEN 'SAVINGS'::"iadm_account_type"
  WHEN "accountType" = 'CHECKING' THEN 'CHECKING'::"iadm_account_type"
  WHEN "accountType" = 'CASH' THEN 'CASH'::"iadm_account_type"
  ELSE 'DEBIT_CARD'::"iadm_account_type"
END;

-- Drop the old column
ALTER TABLE "iadm_financial_account" DROP COLUMN "accountType";

-- Rename the new column
ALTER TABLE "iadm_financial_account" RENAME COLUMN "accountType_new" TO "accountType";

-- Make it non-nullable
ALTER TABLE "iadm_financial_account" ALTER COLUMN "accountType" SET NOT NULL;

-- AlterTable: Movement
-- Add sourceAccountId as foreign key
ALTER TABLE "iadm_movement" ADD COLUMN "sourceAccountId" TEXT;

-- Add isInternalTransfer boolean
ALTER TABLE "iadm_movement" ADD COLUMN "isInternalTransfer" BOOLEAN NOT NULL DEFAULT false;

-- Add foreign key constraint
ALTER TABLE "iadm_movement" ADD CONSTRAINT "iadm_movement_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "iadm_financial_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
