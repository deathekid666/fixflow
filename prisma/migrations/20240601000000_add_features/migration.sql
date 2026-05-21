-- prisma/migrations/20240601000000_add_features/migration.sql
-- Safe additive migration — does NOT touch existing tables/columns

-- ── Shop: add address & phone columns ────────────────────────────────────────
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "phone"   TEXT;

-- ── SatisfactionRating ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SatisfactionRating" (
    "id"          TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "rating"      INTEGER NOT NULL,
    "comment"     TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SatisfactionRating_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SatisfactionRating_workOrderId_key"
    ON "SatisfactionRating"("workOrderId");
ALTER TABLE "SatisfactionRating"
    ADD CONSTRAINT "SatisfactionRating_workOrderId_fkey"
    FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── SmsNotification ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SmsNotification" (
    "id"          TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "phone"       TEXT NOT NULL,
    "message"     TEXT NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "provider"    TEXT NOT NULL DEFAULT 'mock',
    "sentAt"      TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmsNotification_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SmsNotification"
    ADD CONSTRAINT "SmsNotification_workOrderId_fkey"
    FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Shift ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Shift" (
    "id"        TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime"   TIMESTAMP(3),
    "notes"     TEXT,
    "userId"    TEXT NOT NULL,
    "shopId"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Shift"
    ADD CONSTRAINT "Shift_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shift"
    ADD CONSTRAINT "Shift_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "SmsNotification_workOrderId_idx" ON "SmsNotification"("workOrderId");
CREATE INDEX IF NOT EXISTS "Shift_userId_idx"                ON "Shift"("userId");
CREATE INDEX IF NOT EXISTS "Shift_shopId_idx"                ON "Shift"("shopId");
