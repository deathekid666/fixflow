-- Add shopId to Ticket for tenant isolation
-- First add as nullable, then backfill, then make required

ALTER TABLE "Ticket" ADD COLUMN "shopId" TEXT;

-- Backfill shopId from the creator's shopId
UPDATE "Ticket" t
SET "shopId" = u."shopId"
FROM "User" u
WHERE t."userId" = u.id
  AND u."shopId" IS NOT NULL;

-- Delete tickets with no shopId (orphaned rows from dev)
DELETE FROM "Ticket" WHERE "shopId" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Ticket" ALTER COLUMN "shopId" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fix User → Shop relation
ALTER TABLE "User" ADD CONSTRAINT "User_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
