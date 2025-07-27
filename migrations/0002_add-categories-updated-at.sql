-- Add updated_at column with default value for existing records
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp;

-- Update existing records with current timestamp
UPDATE "categories" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;

-- Set NOT NULL constraint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET NOT NULL;