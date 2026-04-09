-- Safe migration: Create enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "iadm_account_type" AS ENUM ('DEBIT_CARD', 'CREDIT_CARD', 'SAVINGS', 'CHECKING', 'CASH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add accountType column if it doesn't exist (default to DEBIT_CARD)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='iadm_financial_account' AND column_name='accountType'
    ) THEN
        ALTER TABLE "iadm_financial_account"
        ADD COLUMN "accountType" "iadm_account_type" NOT NULL DEFAULT 'DEBIT_CARD';
    END IF;
END $$;

-- Add sourceAccountId if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='iadm_movement' AND column_name='sourceAccountId'
    ) THEN
        ALTER TABLE "iadm_movement"
        ADD COLUMN "sourceAccountId" TEXT;
    END IF;
END $$;

-- Add isInternalTransfer if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='iadm_movement' AND column_name='isInternalTransfer'
    ) THEN
        ALTER TABLE "iadm_movement"
        ADD COLUMN "isInternalTransfer" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'iadm_movement_sourceAccountId_fkey'
    ) THEN
        ALTER TABLE "iadm_movement"
        ADD CONSTRAINT "iadm_movement_sourceAccountId_fkey"
        FOREIGN KEY ("sourceAccountId") REFERENCES "iadm_financial_account"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
